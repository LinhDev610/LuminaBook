package com.lumina_book.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lumina_book.backend.entity.ExpiredPromotion;
import com.lumina_book.backend.entity.ExpiredVoucher;
import com.lumina_book.backend.entity.Promotion;
import com.lumina_book.backend.entity.Voucher;
import com.lumina_book.backend.enums.PromotionStatus;
import com.lumina_book.backend.enums.VoucherStatus;
import com.lumina_book.backend.repository.ExpiredPromotionRepository;
import com.lumina_book.backend.repository.ExpiredVoucherRepository;
import com.lumina_book.backend.repository.PromotionRepository;
import com.lumina_book.backend.repository.VoucherRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpirationService {

    private final VoucherRepository voucherRepository;
    private final PromotionRepository promotionRepository;
    private final ExpiredVoucherRepository expiredVoucherRepository;
    private final ExpiredPromotionRepository expiredPromotionRepository;
    private final PromotionService promotionService;

    // Chạy mỗi giờ để kiểm tra và chuyển voucher/promotion hết hạn vào bảng hết hạn
    // Cron expression: giây phút giờ ngày tháng thứ (0 0 * * * * = mỗi giờ)
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void moveExpiredItems() {
        // log.info("Bắt đầu kiểm tra và chuyển voucher/promotion hết hạn...");
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        // Xử lý promotions cần activate (đã đến startDate)
        processPromotionsToActivate(today);

        // Xử lý vouchers hết hạn
        processExpiredVouchers(today, now);

        // Xử lý promotions hết hạn
        processExpiredPromotions(today, now);

        // log.info("Hoàn tất kiểm tra voucher/promotion hết hạn");
    }

    // Xử lý các promotion đã đến startDate - tự động activate và apply vào sản phẩm
    private void processPromotionsToActivate(LocalDate today) {
        List<Promotion> promotionsToActivate = promotionRepository.findPromotionsToActivate(today);

        for (Promotion promotion : promotionsToActivate) {
            try {
                // Activate promotion
                promotion.setIsActive(true);
                promotionRepository.save(promotion);

                // Apply promotion vào các sản phẩm target
                promotionService.applyPromotionToTargets(promotion);

                log.info("Đã tự động kích hoạt và áp dụng promotion {} ({}) cho sản phẩm", promotion.getName(), promotion.getId());
            } catch (Exception e) {
                log.error("Lỗi khi kích hoạt promotion {} ({}): {}", promotion.getName(), promotion.getId(), e.getMessage(), e);
            }
        }
    }

    private void processExpiredVouchers(LocalDate today, LocalDateTime now) {
        List<Voucher> expiredVouchers = voucherRepository.findExpiredVouchers(today, VoucherStatus.EXPIRED);

        for (Voucher voucher : expiredVouchers) {
            // Kiểm tra xem đã được lưu vào bảng hết hạn chưa
            if (!expiredVoucherRepository.existsById(voucher.getId())) {
                ExpiredVoucher expiredVoucher = ExpiredVoucher.builder()
                        .id(voucher.getId())
                        .code(voucher.getCode())
                        .name(voucher.getName())
                        .discountValueType(voucher.getDiscountValueType())
                        .applyScope(voucher.getApplyScope())
                        .minOrderValue(voucher.getMinOrderValue())
                        .maxOrderValue(voucher.getMaxOrderValue())
                        .discountValue(voucher.getDiscountValue())
                        .maxDiscountValue(voucher.getMaxDiscountValue())
                        .startDate(voucher.getStartDate())
                        .expiryDate(voucher.getExpiryDate())
                        .imageUrl(voucher.getImageUrl())
                        .description(voucher.getDescription())
                        .usageLimit(voucher.getUsageLimit())
                        .usageCount(voucher.getUsageCount())
                        .isActive(voucher.getIsActive())
                        .status(voucher.getStatus().name())
                        .submittedBy(voucher.getSubmittedBy() != null ? voucher.getSubmittedBy().getId() : null)
                        .approvedBy(voucher.getApprovedBy() != null ? voucher.getApprovedBy().getId() : null)
                        .submittedAt(voucher.getSubmittedAt())
                        .approvedAt(voucher.getApprovedAt())
                        .expiredAt(now)
                        .rejectionReason(voucher.getRejectionReason())
                        .build();

                expiredVoucherRepository.save(expiredVoucher);
                
                // Cập nhật status của voucher gốc thành EXPIRED
                voucher.setStatus(VoucherStatus.EXPIRED);
                voucherRepository.save(voucher);
                
                log.info("Đã chuyển voucher {} vào bảng hết hạn", voucher.getCode());
            }
        }
    }

    private void processExpiredPromotions(LocalDate today, LocalDateTime now) {
        List<Promotion> expiredPromotions = promotionRepository.findExpiredPromotions(today, PromotionStatus.EXPIRED);

        for (Promotion promotion : expiredPromotions) {
            // Kiểm tra xem đã được lưu vào bảng hết hạn chưa
            if (!expiredPromotionRepository.existsById(promotion.getId())) {
                ExpiredPromotion expiredPromotion = ExpiredPromotion.builder()
                        .id(promotion.getId())
                        .code(promotion.getCode())
                        .name(promotion.getName())
                        .imageUrl(promotion.getImageUrl())
                        .description(promotion.getDescription())
                        .discountValue(promotion.getDiscountValue())
                        .minOrderValue(promotion.getMinOrderValue())
                        .maxDiscountValue(promotion.getMaxDiscountValue())
                        .startDate(promotion.getStartDate())
                        .expiryDate(promotion.getExpiryDate())
                        .usageCount(promotion.getUsageCount())
                        .isActive(promotion.getIsActive())
                        .status(promotion.getStatus().name())
                        .submittedBy(promotion.getSubmittedBy() != null ? promotion.getSubmittedBy().getId() : null)
                        .approvedBy(promotion.getApprovedBy() != null ? promotion.getApprovedBy().getId() : null)
                        .submittedAt(promotion.getSubmittedAt())
                        .approvedAt(promotion.getApprovedAt())
                        .expiredAt(now)
                        .rejectionReason(promotion.getRejectionReason())
                        .build();

                expiredPromotionRepository.save(expiredPromotion);
                promotionService.detachPromotionFromProducts(promotion);
                
                // Cập nhật status của promotion gốc thành EXPIRED
                promotion.setStatus(PromotionStatus.EXPIRED);
                promotionRepository.save(promotion);
                
                log.info("Đã chuyển promotion {} ({}) vào bảng hết hạn", promotion.getName(), promotion.getId());
            }
        }
    }
}

