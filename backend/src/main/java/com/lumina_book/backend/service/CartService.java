package com.lumina_book.backend.service;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lumina_book.backend.entity.*;
import com.lumina_book.backend.exception.AppException;
import com.lumina_book.backend.exception.ErrorCode;
import com.lumina_book.backend.repository.CartItemRepository;
import com.lumina_book.backend.repository.CartRepository;
import com.lumina_book.backend.repository.ProductRepository;
import com.lumina_book.backend.repository.PromotionRepository;
import com.lumina_book.backend.repository.UserRepository;
import com.lumina_book.backend.repository.VoucherRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CartService {

    CartRepository cartRepository;
    CartItemRepository cartItemRepository;
    UserRepository userRepository;
    ProductRepository productRepository;
    PromotionRepository promotionRepository;
    VoucherRepository voucherRepository;

    @Transactional
    @PreAuthorize("hasAuthority('CUSTOMER')")
    public Cart getOrCreateCartForCurrentCustomer() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return cartRepository
                .findByUserId(user.getId())
                .orElseGet(() -> cartRepository.save(Cart.builder().user(user).build()));
    }

    @Transactional
    @PreAuthorize("hasAuthority('CUSTOMER')")
    public Cart addItem(String productId, int quantity) {
        if (quantity <= 0) {
            throw new AppException(ErrorCode.OUT_OF_STOCK);
        }

        Cart cart = getOrCreateCartForCurrentCustomer();

        Product product = productRepository
                .findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));

        CartItem cartItem = cartItemRepository
                .findByCartIdAndProductId(cart.getId(), productId)
                .orElse(CartItem.builder()
                        .cart(cart)
                        .product(product)
                        .unitPrice(calculateUnitPrice(product))
                        .quantity(0)
                        .build());

        cartItem.setQuantity(cartItem.getQuantity() + quantity);
        double finalPrice = cartItem.getQuantity() * cartItem.getUnitPrice();
        cartItem.setFinalPrice(finalPrice);

        cartItemRepository.save(cartItem);
        recalcCartTotals(cart);
        return cart;
    }

    private double calculateUnitPrice(Product product) {
        double basePrice = product.getPrice();
        double discounted = basePrice;
        // Apply active promotions by product
        var today = java.time.LocalDate.now();
        var promosByProduct = promotionRepository.findActiveByProductId(product.getId(), today);
        var promosByCategory = product.getCategory() == null
                ? java.util.List.<com.lumina_book.backend.entity.Promotion>of()
                : promotionRepository.findActiveByCategoryId(
                        product.getCategory().getId(), today);

        for (var p : java.util.stream.Stream.concat(promosByProduct.stream(), promosByCategory.stream())
                .toList()) {
            Double dv = p.getDiscountValue();
            if (dv == null || dv <= 0) continue;
            // Heuristic: <=1 => percent, else amount
            double candidate = dv <= 1.0 ? basePrice * (1.0 - dv) : basePrice - dv;
            if (p.getMaxDiscountValue() != null && p.getMaxDiscountValue() > 0 && dv > 1.0) {
                candidate = Math.max(basePrice - p.getMaxDiscountValue(), candidate);
            }
            discounted = Math.min(discounted, Math.max(candidate, 0));
        }

        // Apply tax if provided (assume tax is percentage, e.g., 0.1 for 10%) to derive pre-tax unit price? Keep
        // unitPrice pre-tax
        return discounted;
    }

    private void recalcCartTotals(Cart cart) {
        double subtotal = cart.getCartItems() == null
                ? 0.0
                : cart.getCartItems().stream()
                        .mapToDouble(CartItem::getFinalPrice)
                        .sum();
        cart.setSubtotal(subtotal);
        double voucherDiscount = cart.getVoucherDiscount();
        double total = Math.max(0.0, subtotal - (voucherDiscount == 0 ? 0.0 : voucherDiscount));
        cart.setTotalAmount(total);
        cartRepository.save(cart);
    }

    @Transactional
    @PreAuthorize("hasAuthority('CUSTOMER')")
    public Cart applyVoucher(String code) {
        Cart cart = getOrCreateCartForCurrentCustomer();
        if (cart.getCartItems() == null || cart.getCartItems().isEmpty()) {
            throw new AppException(ErrorCode.CART_ITEM_NOT_EXISTED);
        }

        var voucher =
                voucherRepository.findByCode(code).orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_EXISTED));

        if (!voucher.getIsActive() || voucher.getStatus() != com.lumina_book.backend.enums.VoucherStatus.APPROVED) {
            throw new AppException(ErrorCode.VOUCHER_NOT_EXISTED);
        }
        var today = java.time.LocalDate.now();
        if ((voucher.getStartDate() != null && today.isBefore(voucher.getStartDate()))
                || (voucher.getExpiryDate() != null && today.isAfter(voucher.getExpiryDate()))) {
            throw new AppException(ErrorCode.VOUCHER_NOT_EXISTED);
        }

        recalcCartTotals(cart);
        double subtotal = cart.getSubtotal();
        if (voucher.getMinOrderValue() > 0 && subtotal < voucher.getMinOrderValue()) {
            throw new AppException(ErrorCode.INVALID_VOUCHER_MINIUM);
        }

        double discountValue = voucher.getDiscountValue();
        double discount;
        if ("PERCENT".equalsIgnoreCase(voucher.getDiscountType())) {
            discount = subtotal * (discountValue / 100.0);
        } else {
            discount = discountValue;
        }
        if (voucher.getMaxDiscountValue() > 0) {
            discount = Math.min(discount, voucher.getMaxDiscountValue());
        }
        discount = Math.min(discount, subtotal);

        cart.setAppliedVoucherCode(voucher.getCode());
        cart.setVoucherDiscount(discount);
        cart.setTotalAmount(Math.max(0.0, subtotal - discount));
        return cartRepository.save(cart);
    }
}
