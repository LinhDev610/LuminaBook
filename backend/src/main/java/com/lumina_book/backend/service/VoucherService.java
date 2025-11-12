package com.lumina_book.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lumina_book.backend.dto.request.ApproveVoucherRequest;
import com.lumina_book.backend.dto.request.VoucherCreationRequest;
import com.lumina_book.backend.dto.request.VoucherUpdateRequest;
import com.lumina_book.backend.dto.response.VoucherResponse;
import com.lumina_book.backend.entity.Category;
import com.lumina_book.backend.entity.Product;
import com.lumina_book.backend.entity.User;
import com.lumina_book.backend.entity.Voucher;
import com.lumina_book.backend.enums.DiscountApplyScope;
import com.lumina_book.backend.enums.VoucherStatus;
import com.lumina_book.backend.exception.AppException;
import com.lumina_book.backend.exception.ErrorCode;
import com.lumina_book.backend.mapper.VoucherMapper;
import com.lumina_book.backend.repository.CategoryRepository;
import com.lumina_book.backend.repository.ProductRepository;
import com.lumina_book.backend.repository.UserRepository;
import com.lumina_book.backend.repository.VoucherRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class VoucherService {

    VoucherRepository voucherRepository;
    UserRepository userRepository;
    CategoryRepository categoryRepository;
    ProductRepository productRepository;
    VoucherMapper voucherMapper;

    @Transactional
    public VoucherResponse createVoucher(VoucherCreationRequest request) {
        User staff = getCurrentUser();

        if (voucherRepository.existsByCode(request.getCode())) {
            throw new AppException(ErrorCode.VOUCHER_CODE_ALREADY_EXISTS);
        }

        Voucher voucher = voucherMapper.toVoucher(request);
        voucher.setSubmittedBy(staff);
        voucher.setSubmittedAt(LocalDateTime.now());
        voucher.setUsageCount(0);
        voucher.setIsActive(false);
        voucher.setStatus(VoucherStatus.PENDING_APPROVAL);

        applyScopeTargets(request.getApplyScope(), request.getCategoryIds(), request.getProductIds(), voucher);

        Voucher savedVoucher = voucherRepository.save(voucher);
        // log.info("Voucher created with ID: {} by staff: {}", savedVoucher.getId(), staff.getId());

        return voucherMapper.toResponse(savedVoucher);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public VoucherResponse approveVoucher(ApproveVoucherRequest request) {
        User admin = getCurrentUser();

        Voucher voucher = voucherRepository
                .findById(request.getVoucherId())
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_EXISTED));

        if (voucher.getStatus() != VoucherStatus.PENDING_APPROVAL) {
            throw new AppException(ErrorCode.VOUCHER_NOT_PENDING);
        }

        if ("APPROVE".equals(request.getAction())) {
            voucher.setStatus(VoucherStatus.APPROVED);
            voucher.setIsActive(true);
            voucher.setApprovedBy(admin);
            voucher.setApprovedAt(LocalDateTime.now());
            voucher.setRejectionReason(null);
            // log.info("Voucher approved: {} by admin: {}", voucher.getId(), admin.getId());
        } else if ("REJECT".equals(request.getAction())) {
            voucher.setStatus(VoucherStatus.REJECTED);
            voucher.setIsActive(false);
            voucher.setApprovedBy(admin);
            voucher.setApprovedAt(LocalDateTime.now());
            voucher.setRejectionReason(request.getReason());
            // log.info("Voucher rejected: {} by admin: {}", voucher.getId(), admin.getId());
        }

        Voucher savedVoucher = voucherRepository.save(voucher);
        return voucherMapper.toResponse(savedVoucher);
    }

    public VoucherResponse getVoucherById(String voucherId) {
        Voucher voucher = voucherRepository
                .findById(voucherId)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_EXISTED));
        return voucherMapper.toResponse(voucher);
    }

    public List<VoucherResponse> getMyVouchers() {
        User staff = getCurrentUser();

        return voucherRepository.findBySubmittedBy(staff).stream()
                .map(voucherMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<VoucherResponse> getPendingVouchers() {
        return voucherRepository.findByStatus(VoucherStatus.PENDING_APPROVAL).stream()
                .map(voucherMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<VoucherResponse> getVouchersByStatus(VoucherStatus status) {
        return voucherRepository.findByStatus(status).stream()
                .map(voucherMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<VoucherResponse> getActiveVouchers() {
        return voucherRepository.findActiveVouchers(LocalDate.now()).stream()
                .map(voucherMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public VoucherResponse updateVoucher(String voucherId, VoucherUpdateRequest request) {
        User currentUser = getCurrentUser();
        String currentUserId = currentUser.getId();

        Voucher voucher = voucherRepository
                .findById(voucherId)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_EXISTED));

        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(auth -> "ROLE_ADMIN".equals(auth.getAuthority()));

        if (!isAdmin && voucher.getSubmittedBy() != null && !voucher.getSubmittedBy().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (request.getCode() != null && !request.getCode().equals(voucher.getCode()) && voucherRepository.existsByCode(request.getCode())) {
            throw new AppException(ErrorCode.VOUCHER_CODE_ALREADY_EXISTS);
        }

        voucherMapper.updateVoucher(voucher, request);

        if (request.getApplyScope() != null || request.getCategoryIds() != null || request.getProductIds() != null) {
            DiscountApplyScope scope = request.getApplyScope() != null ? request.getApplyScope() : voucher.getApplyScope();
            applyScopeTargets(scope, request.getCategoryIds(), request.getProductIds(), voucher);
            voucher.setApplyScope(scope);
        }

        Voucher savedVoucher = voucherRepository.save(voucher);
        log.info("Voucher updated: {} by user: {}", voucherId, currentUserId);

        return voucherMapper.toResponse(savedVoucher);
    }

    @Transactional
    public void deleteVoucher(String voucherId) {
        User currentUser = getCurrentUser();
        String currentUserId = currentUser.getId();

        Voucher voucher = voucherRepository
                .findById(voucherId)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_EXISTED));

        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(auth -> "ROLE_ADMIN".equals(auth.getAuthority()));

        if (!isAdmin && voucher.getSubmittedBy() != null && !voucher.getSubmittedBy().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        voucherRepository.delete(voucher);
//        log.info("Voucher deleted: {} by user: {}", voucherId, currentUserId);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private void applyScopeTargets(
            DiscountApplyScope scope, Set<String> categoryIds, Set<String> productIds, Voucher voucher) {
        if (scope == null) {
            return;
        }

        voucher.getCategoryApply().clear();
        voucher.getProductApply().clear();

        switch (scope) {
            case CATEGORY -> {
                if (productIds != null && !productIds.isEmpty()) {
                    throw new AppException(ErrorCode.INVALID_VOUCHER_SCOPE);
                }
                voucher.getCategoryApply().addAll(resolveCategories(categoryIds));
                voucher.getProductApply().clear();
            }
            case PRODUCT -> {
                if (categoryIds != null && !categoryIds.isEmpty()) {
                    throw new AppException(ErrorCode.INVALID_VOUCHER_SCOPE);
                }
                voucher.getProductApply().addAll(resolveProducts(productIds));
                voucher.getCategoryApply().clear();
            }
            case ORDER -> {
                if ((categoryIds != null && !categoryIds.isEmpty()) || (productIds != null && !productIds.isEmpty())) {
                    throw new AppException(ErrorCode.INVALID_VOUCHER_SCOPE);
                }
                voucher.getCategoryApply().clear();
                voucher.getProductApply().clear();
            }
            default -> throw new AppException(ErrorCode.INVALID_VOUCHER_SCOPE);
        }
        voucher.setApplyScope(scope);
    }

    private Set<Category> resolveCategories(Set<String> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_VOUCHER_SCOPE);
        }

        return categoryIds.stream()
                .map(categoryId -> categoryRepository
                        .findById(categoryId)
                        .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED)))
                .collect(Collectors.toSet());
    }

    private Set<Product> resolveProducts(Set<String> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_VOUCHER_SCOPE);
        }

        return productIds.stream()
                .map(productId -> productRepository
                        .findById(productId)
                        .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED)))
                .collect(Collectors.toSet());
    }
}


