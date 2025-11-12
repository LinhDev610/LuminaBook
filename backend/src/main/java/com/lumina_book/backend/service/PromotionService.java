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

import com.lumina_book.backend.dto.request.ApprovePromotionRequest;
import com.lumina_book.backend.dto.request.PromotionCreationRequest;
import com.lumina_book.backend.dto.request.PromotionUpdateRequest;
import com.lumina_book.backend.dto.response.PromotionResponse;
import com.lumina_book.backend.entity.Category;
import com.lumina_book.backend.entity.Product;
import com.lumina_book.backend.entity.Promotion;
import com.lumina_book.backend.entity.User;
import com.lumina_book.backend.enums.DiscountApplyScope;
import com.lumina_book.backend.enums.PromotionStatus;
import com.lumina_book.backend.exception.AppException;
import com.lumina_book.backend.exception.ErrorCode;
import com.lumina_book.backend.mapper.PromotionMapper;
import com.lumina_book.backend.repository.CategoryRepository;
import com.lumina_book.backend.repository.ProductRepository;
import com.lumina_book.backend.repository.PromotionRepository;
import com.lumina_book.backend.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PromotionService {

    PromotionRepository promotionRepository;
    UserRepository userRepository;
    CategoryRepository categoryRepository;
    ProductRepository productRepository;
    PromotionMapper promotionMapper;

    @Transactional
    public PromotionResponse createPromotion(PromotionCreationRequest request) {
        // Get current user from security context
        User staff = getCurrentUser();

        // Create promotion entity using mapper
        Promotion promotion = promotionMapper.toPromotion(request);

        if (promotionRepository.existsByCode(promotion.getCode())) {
            throw new AppException(ErrorCode.PROMOTION_CODE_ALREADY_EXISTS);
        }

        // Set workflow fields
        promotion.setUsageCount(0);
        promotion.setIsActive(false); // Chưa active cho đến khi được approve
        promotion.setStatus(PromotionStatus.PENDING);
        promotion.setSubmittedBy(staff);
        promotion.setSubmittedAt(LocalDateTime.now());

        applyScopeTargets(request.getApplyScope(), request.getCategoryIds(), request.getProductIds(), promotion);

        Promotion savedPromotion = promotionRepository.save(promotion);
        log.info("Promotion created with ID: {} by staff: {}", savedPromotion.getId(), staff.getId());

        return promotionMapper.toResponse(savedPromotion);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public PromotionResponse approvePromotion(ApprovePromotionRequest request) {
        // Get current admin from security context
        User admin = getCurrentUser();

        // Get promotion
        Promotion promotion = promotionRepository
                .findById(request.getPromotionId())
                .orElseThrow(() -> new AppException(ErrorCode.PROMOTION_NOT_EXISTED));

        if (promotion.getStatus() != PromotionStatus.PENDING) {
            throw new AppException(ErrorCode.PROMOTION_NOT_PENDING);
        }

        if ("APPROVE".equals(request.getAction())) {
            promotion.setStatus(PromotionStatus.APPROVED);
            promotion.setApprovedBy(admin);
            promotion.setApprovedAt(LocalDateTime.now());
            promotion.setIsActive(true);
            // log.info("Promotion approved: {} by admin: {}", promotion.getId(), admin.getId());
        } else if ("REJECT".equals(request.getAction())) {
            promotion.setStatus(PromotionStatus.REJECTED);
            promotion.setApprovedBy(admin);
            promotion.setApprovedAt(LocalDateTime.now());
            promotion.setRejectionReason(request.getReason());
            // log.info("Promotion rejected: {} by admin: {}", promotion.getId(), admin.getId());
        }

        Promotion savedPromotion = promotionRepository.save(promotion);
        return promotionMapper.toResponse(savedPromotion);
    }

    public PromotionResponse getPromotionById(String promotionId) {
        Promotion promotion = promotionRepository
                .findById(promotionId)
                .orElseThrow(() -> new AppException(ErrorCode.PROMOTION_NOT_EXISTED));

        return promotionMapper.toResponse(promotion);
    }

    public List<PromotionResponse> getMyPromotions() {
        // Get current user from security context
        User staff = getCurrentUser();

        List<Promotion> promotions = promotionRepository.findBySubmittedBy(staff);

        return promotions.stream().map(promotionMapper::toResponse).collect(Collectors.toList());
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<PromotionResponse> getPendingPromotions() {
        List<Promotion> pendingPromotions = promotionRepository.findByStatus(PromotionStatus.PENDING);

        return pendingPromotions.stream().map(promotionMapper::toResponse).collect(Collectors.toList());
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<PromotionResponse> getPromotionsByStatus(PromotionStatus status) {
        List<Promotion> promotions = promotionRepository.findByStatus(status);

        return promotions.stream().map(promotionMapper::toResponse).collect(Collectors.toList());
    }

    public List<PromotionResponse> getActivePromotions() {
        List<Promotion> activePromotions = promotionRepository.findActivePromotions(LocalDate.now());

        return activePromotions.stream().map(promotionMapper::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public PromotionResponse updatePromotion(String promotionId, PromotionUpdateRequest request) {
        // Get current user from security context
        User currentUser = getCurrentUser();
        String currentUserId = currentUser.getId();

        Promotion promotion = promotionRepository
                .findById(promotionId)
                .orElseThrow(() -> new AppException(ErrorCode.PROMOTION_NOT_EXISTED));

        // Check if user is the submitter or admin
        var context = SecurityContextHolder.getContext();
        boolean isAdmin = context.getAuthentication().getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && !promotion.getSubmittedBy().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (request.getCode() != null && !request.getCode().equals(promotion.getCode()) && promotionRepository.existsByCode(request.getCode())) {
            throw new AppException(ErrorCode.PROMOTION_CODE_ALREADY_EXISTS);
        }

        // Update promotion using mapper
        promotionMapper.updatePromotion(promotion, request);

        if (request.getApplyScope() != null || request.getCategoryIds() != null || request.getProductIds() != null) {
            DiscountApplyScope scope =
                    request.getApplyScope() != null ? request.getApplyScope() : promotion.getApplyScope();
            applyScopeTargets(scope, request.getCategoryIds(), request.getProductIds(), promotion);
            promotion.setApplyScope(scope);
        }

        Promotion savedPromotion = promotionRepository.save(promotion);
        // log.info("Promotion updated: {} by user: {}", promotionId, currentUserId);

        return promotionMapper.toResponse(savedPromotion);
    }

    @Transactional
    public void deletePromotion(String promotionId) {
        // Get current user from security context
        User currentUser = getCurrentUser();
        String currentUserId = currentUser.getId();

        Promotion promotion = promotionRepository
                .findById(promotionId)
                .orElseThrow(() -> new AppException(ErrorCode.PROMOTION_NOT_EXISTED));

        // Check if user is the submitter or admin
        var context = SecurityContextHolder.getContext();
        boolean isAdmin = context.getAuthentication().getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && !promotion.getSubmittedBy().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        promotionRepository.delete(promotion);
        // log.info("Promotion deleted: {} by user: {}", promotionId, currentUserId);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private void applyScopeTargets(
            DiscountApplyScope scope, Set<String> categoryIds, Set<String> productIds, Promotion promotion) {
        if (scope == null) {
            throw new AppException(ErrorCode.INVALID_PROMOTION_SCOPE);
        }

        promotion.getCategoryApply().clear();
        promotion.getProductApply().clear();

        switch (scope) {
            case CATEGORY -> {
                if (productIds != null && !productIds.isEmpty()) {
                    throw new AppException(ErrorCode.INVALID_PROMOTION_SCOPE);
                }
                promotion.getCategoryApply().addAll(resolveCategories(categoryIds));
            }
            case PRODUCT -> {
                if (categoryIds != null && !categoryIds.isEmpty()) {
                    throw new AppException(ErrorCode.INVALID_PROMOTION_SCOPE);
                }
                promotion.getProductApply().addAll(resolveProducts(productIds));
            }
            case ORDER -> {
                if ((categoryIds != null && !categoryIds.isEmpty()) || (productIds != null && !productIds.isEmpty())) {
                    throw new AppException(ErrorCode.INVALID_PROMOTION_SCOPE);
                }
            }
            default -> throw new AppException(ErrorCode.INVALID_PROMOTION_SCOPE);
        }
        promotion.setApplyScope(scope);
    }

    private Set<Category> resolveCategories(Set<String> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_PROMOTION_SCOPE);
        }

        return categoryIds.stream()
                .map(categoryId -> categoryRepository
                        .findById(categoryId)
                        .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED)))
                .collect(Collectors.toSet());
    }

    private Set<Product> resolveProducts(Set<String> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_PROMOTION_SCOPE);
        }

        return productIds.stream()
                .map(productId -> productRepository
                        .findById(productId)
                        .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED)))
                .collect(Collectors.toSet());
    }
}
