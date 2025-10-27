package com.lumina_book.backend.service;

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
        var context = SecurityContextHolder.getContext();
        String staffId = context.getAuthentication().getName();

        // Get staff user
        User staff = userRepository.findById(staffId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Create promotion entity using mapper
        Promotion promotion = promotionMapper.toPromotion(request);

        // Set workflow fields
        promotion.setUsageCount(0);
        promotion.setIsActive(false); // Chưa active cho đến khi được approve
        promotion.setStatus(PromotionStatus.PENDING);
        promotion.setSubmittedBy(staff);
        promotion.setSubmittedAt(LocalDateTime.now());

        // Validate and set categories if provided
        if (request.getCategoryIds() != null && !request.getCategoryIds().isEmpty()) {
            Set<Category> categories = request.getCategoryIds().stream()
                    .map(categoryId -> categoryRepository
                            .findById(categoryId)
                            .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED)))
                    .collect(Collectors.toSet());
            promotion.setCategoryApply(categories);
        }

        // Validate and set products if provided
        if (request.getProductIds() != null && !request.getProductIds().isEmpty()) {
            Set<Product> products = request.getProductIds().stream()
                    .map(productId -> productRepository
                            .findById(productId)
                            .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED)))
                    .collect(Collectors.toSet());
            promotion.setProductApply(products);
        }

        Promotion savedPromotion = promotionRepository.save(promotion);
        log.info("Promotion created with ID: {} by staff: {}", savedPromotion.getId(), staffId);

        return promotionMapper.toResponse(savedPromotion);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public PromotionResponse approvePromotion(ApprovePromotionRequest request) {
        // Get current admin from security context
        var context = SecurityContextHolder.getContext();
        String adminId = context.getAuthentication().getName();

        // Get admin user
        User admin = userRepository.findById(adminId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Get promotion
        Promotion promotion = promotionRepository
                .findById(request.getPromotionId())
                .orElseThrow(() -> new AppException(ErrorCode.PROMOTION_NOT_EXISTED));

        // Update promotion based on action
        if ("APPROVE".equals(request.getAction())) {
            promotion.setStatus(PromotionStatus.APPROVED);
            promotion.setApprovedBy(admin);
            promotion.setApprovedAt(LocalDateTime.now());
            promotion.setIsActive(true);
            log.info("Promotion approved: {} by admin: {}", promotion.getId(), adminId);
        } else if ("REJECT".equals(request.getAction())) {
            promotion.setStatus(PromotionStatus.REJECTED);
            promotion.setApprovedBy(admin);
            promotion.setApprovedAt(LocalDateTime.now());
            promotion.setRejectionReason(request.getReason());
            log.info("Promotion rejected: {} by admin: {}", promotion.getId(), adminId);
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
        var context = SecurityContextHolder.getContext();
        String staffId = context.getAuthentication().getName();

        User staff = userRepository.findById(staffId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

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
        List<Promotion> activePromotions = promotionRepository.findActivePromotions(java.time.LocalDate.now());

        return activePromotions.stream().map(promotionMapper::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public PromotionResponse updatePromotion(String promotionId, PromotionUpdateRequest request) {
        // Get current user from security context
        var context = SecurityContextHolder.getContext();
        String staffId = context.getAuthentication().getName();

        Promotion promotion = promotionRepository
                .findById(promotionId)
                .orElseThrow(() -> new AppException(ErrorCode.PROMOTION_NOT_EXISTED));

        // Check if user is the submitter or admin
        boolean isAdmin = context.getAuthentication().getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && !promotion.getSubmittedBy().getId().equals(staffId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Update promotion using mapper
        promotionMapper.updatePromotion(promotion, request);

        // Update categories and products if provided
        if (request.getCategoryIds() != null && !request.getCategoryIds().isEmpty()) {
            Set<Category> categories = request.getCategoryIds().stream()
                    .map(categoryId -> categoryRepository
                            .findById(categoryId)
                            .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED)))
                    .collect(Collectors.toSet());
            promotion.setCategoryApply(categories);
        }

        if (request.getProductIds() != null && !request.getProductIds().isEmpty()) {
            Set<Product> products = request.getProductIds().stream()
                    .map(productId -> productRepository
                            .findById(productId)
                            .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED)))
                    .collect(Collectors.toSet());
            promotion.setProductApply(products);
        }

        Promotion savedPromotion = promotionRepository.save(promotion);
        log.info("Promotion updated: {} by user: {}", promotionId, staffId);

        return promotionMapper.toResponse(savedPromotion);
    }

    @Transactional
    public void deletePromotion(String promotionId) {
        // Get current user from security context
        var context = SecurityContextHolder.getContext();
        String staffId = context.getAuthentication().getName();

        Promotion promotion = promotionRepository
                .findById(promotionId)
                .orElseThrow(() -> new AppException(ErrorCode.PROMOTION_NOT_EXISTED));

        // Check if user is the submitter or admin
        boolean isAdmin = context.getAuthentication().getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && !promotion.getSubmittedBy().getId().equals(staffId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        promotionRepository.delete(promotion);
        log.info("Promotion deleted: {} by user: {}", promotionId, staffId);
    }
}
