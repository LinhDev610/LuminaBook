package com.lumina_book.backend.service;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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
import com.lumina_book.backend.enums.DiscountValueType;
import com.lumina_book.backend.enums.DiscountApplyScope;
import com.lumina_book.backend.repository.VoucherRepository;
import com.lumina_book.backend.util.SecurityUtil;

import java.time.LocalDate;

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
    @SuppressWarnings("unused")
    PromotionRepository promotionRepository;
    VoucherRepository voucherRepository;

    @Transactional
    @PreAuthorize("hasRole('CUSTOMER')")
    public Cart getOrCreateCartForCurrentCustomer() {
        // Authentication name đang là email (subject của JWT)
        String email = SecurityUtil.getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Lấy cart hiện tại của user (nếu có), nếu không thì tạo mới.
        return cartRepository
                .findByUserId(user.getId())
                .orElseGet(() -> cartRepository.save(Cart.builder().user(user).build()));
    }

    @Transactional
    @PreAuthorize("hasRole('CUSTOMER')")
    public Cart getCart() {
        Cart cart = getOrCreateCartForCurrentCustomer();
        // Force load cart items to avoid lazy loading issues
        if (cart.getCartItems() != null) {
            cart.getCartItems().size(); // Trigger lazy loading
        }
        // Recalculate totals to ensure they are up to date
        recalcCartTotals(cart);
        return cart;
    }

    @Transactional
    @PreAuthorize("hasRole('CUSTOMER')")
    public Cart addItem(String productId, int quantity) {
        if (quantity <= 0) {
            throw new AppException(ErrorCode.OUT_OF_STOCK);
        }

        Cart cart = getOrCreateCartForCurrentCustomer();

        Product product = productRepository
                .findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));

        // Kiểm tra tồn kho thực tế
        Integer stockQuantity = product.getInventory() != null ? product.getInventory().getStockQuantity() : null;
        if (stockQuantity != null && stockQuantity <= 0) {
            throw new AppException(ErrorCode.OUT_OF_STOCK);
        }

        CartItem cartItem = cartItemRepository
                .findByCartIdAndProductId(cart.getId(), productId)
                .orElse(CartItem.builder()
                        .cart(cart)
                        .product(product)
                        .unitPrice(calculateUnitPrice(product))
                        .quantity(0)
                        .build());

        int currentQty = cartItem.getQuantity() == null ? 0 : cartItem.getQuantity();
        int newQty = currentQty + quantity;

        // Nếu có tồn kho thì giới hạn số lượng không vượt quá stock
        if (stockQuantity != null && newQty > stockQuantity) {
            throw new AppException(ErrorCode.OUT_OF_STOCK);
        }

        cartItem.setQuantity(newQty);
        double finalPrice = cartItem.getQuantity() * cartItem.getUnitPrice();
        cartItem.setFinalPrice(finalPrice);

        cartItemRepository.save(cartItem);
        recalcCartTotals(cart);
        return cart;
    }

    /**
     * Tính đơn giá sản phẩm cho giỏ hàng.
     * Hiện tại giá khuyến mãi đã được áp trực tiếp vào product.price
     * (PromotionService.applyPricingForProducts), nên ở đây chỉ cần lấy lại
     * product.price và làm tròn về đồng, KHÔNG áp khuyến mãi lần nữa để tránh
     * giảm hai lần (ví dụ 100k giảm 10% => 90k, không phải 89.980).
     */
    private double calculateUnitPrice(Product product) {
        double price = product.getPrice() != null ? product.getPrice() : 0.0;
        return Math.round(price);
    }

    private void recalcCartTotals(Cart cart) {
        // Đồng bộ lại đơn giá và thành tiền của từng cartItem
        if (cart.getCartItems() != null && !cart.getCartItems().isEmpty()) {
            cart.getCartItems().forEach(item -> {
                Product product = item.getProduct();
                if (product != null) {
                    // Tính lại đơn giá dựa trên cấu hình khuyến mãi hiện tại
                    double unitPrice = calculateUnitPrice(product);
                    item.setUnitPrice(unitPrice);
                    // Thành tiền = đơn giá * số lượng
                    double finalPrice = unitPrice * item.getQuantity();
                    item.setFinalPrice(finalPrice);
                    cartItemRepository.save(item);
                }
            });
        }

        // Tính lại subtotal từ các cartItem (nếu chưa có item thì subtotal = 0)
        double subtotal = cart.getCartItems() == null
                ? 0.0
                : cart.getCartItems().stream()
                        .mapToDouble(item -> {
                            Double finalPrice = item.getFinalPrice();
                            return finalPrice != null ? finalPrice : 0.0;
                        })
                        .sum();
        // Làm tròn subtotal về đơn vị đồng
        subtotal = Math.round(subtotal);
        cart.setSubtotal(subtotal);

        // voucherDiscount có thể null với giỏ hàng mới => mặc định 0
        Double rawVoucherDiscount = cart.getVoucherDiscount();
        double voucherDiscount = rawVoucherDiscount == null ? 0.0 : rawVoucherDiscount;
        // Làm tròn tiền giảm giá về đơn vị đồng
        voucherDiscount = Math.round(voucherDiscount);

        // Validate lại voucher nếu có voucher đã được áp dụng
        if (cart.getAppliedVoucherCode() != null && !cart.getAppliedVoucherCode().isEmpty()) {
            try {
                var voucher = voucherRepository.findByCode(cart.getAppliedVoucherCode()).orElse(null);
                if (voucher != null && voucher.getIsActive() && voucher.getStatus() == com.lumina_book.backend.enums.VoucherStatus.APPROVED) {
                    double applicableSubtotal = calculateApplicableSubtotal(cart, voucher);
                    
                    // Kiểm tra lại minOrderValue
                    if (voucher.getMinOrderValue() != null && voucher.getMinOrderValue() > 0 
                            && applicableSubtotal < voucher.getMinOrderValue()) {
                        // Voucher không còn hợp lệ, xóa voucher
                        cart.setAppliedVoucherCode(null);
                        voucherDiscount = 0.0;
                    } else if (voucher.getMaxOrderValue() != null && voucher.getMaxOrderValue() > 0 
                            && applicableSubtotal > voucher.getMaxOrderValue()) {
                        // Voucher không còn hợp lệ, xóa voucher
                        cart.setAppliedVoucherCode(null);
                        voucherDiscount = 0.0;
                    } else {
                        // Tính lại discount dựa trên applicableSubtotal
                        double discountValue = voucher.getDiscountValue();
                        double discount;
                        if (voucher.getDiscountValueType() == DiscountValueType.PERCENTAGE) {
                            discount = applicableSubtotal * (discountValue / 100.0);
                        } else {
                            discount = discountValue;
                        }
                        
                        if (voucher.getMaxDiscountValue() != null && voucher.getMaxDiscountValue() > 0) {
                            discount = Math.min(discount, voucher.getMaxDiscountValue());
                        }
                        discount = Math.min(discount, applicableSubtotal);
                        discount = Math.round(discount);
                        voucherDiscount = discount;
                    }
                } else {
                    // Voucher không còn active hoặc không tồn tại, xóa voucher
                    cart.setAppliedVoucherCode(null);
                    voucherDiscount = 0.0;
                }
            } catch (Exception e) {
                // Nếu có lỗi khi validate, xóa voucher để tránh lỗi
                cart.setAppliedVoucherCode(null);
                voucherDiscount = 0.0;
            }
        }

        if (subtotal <= 0) {
            cart.setAppliedVoucherCode(null);
            voucherDiscount = 0.0;
        }
        cart.setVoucherDiscount(voucherDiscount);

        double total = Math.max(0.0, subtotal - voucherDiscount);
        // Làm tròn tổng tiền về đơn vị đồng
        total = Math.round(total);
        cart.setTotalAmount(total);

        // Lưu lại cart với giá trị subtotal / totalAmount mới
        cartRepository.save(cart);
    }

    @Transactional
    @PreAuthorize("hasRole('CUSTOMER')")
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
        LocalDate today = LocalDate.now();
        if ((voucher.getStartDate() != null && today.isBefore(voucher.getStartDate()))
                || (voucher.getExpiryDate() != null && today.isAfter(voucher.getExpiryDate()))) {
            throw new AppException(ErrorCode.VOUCHER_NOT_EXISTED);
        }
        
        // Lấy current user
        User currentUser = cart.getUser();
        if (currentUser == null) {
            Authentication authentication = SecurityUtil.getAuthentication();
            currentUser = userRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        }
        
        // Lưu userId vào biến final để sử dụng trong lambda
        final String userId = currentUser.getId();
        
        boolean alreadyUsed = userRepository.existsByIdAndUsedVouchers_Id(userId, voucher.getId());
        if (alreadyUsed) {
            throw new AppException(ErrorCode.VOUCHER_ALREADY_USED);
        }
        
        recalcCartTotals(cart);
        
        // Tính tổng giá trị đơn hàng có thể áp dụng voucher
        double applicableSubtotal = calculateApplicableSubtotal(cart, voucher);
        
        // Kiểm tra minOrderValue: giá trị đơn hàng phải >= minOrderValue (nếu có)
        if (voucher.getMinOrderValue() != null && voucher.getMinOrderValue() > 0) {
            double minValue = voucher.getMinOrderValue();
            if (applicableSubtotal < minValue) {
                throw new AppException(ErrorCode.INVALID_VOUCHER_MINIUM, 
                        String.format("Voucher yêu cầu đơn hàng tối thiểu %.0f VND, nhưng đơn hàng hiện tại chỉ có %.0f VND", 
                                minValue, applicableSubtotal));
            }
        }
        
        // Kiểm tra maxOrderValue: giá trị đơn hàng phải <= maxOrderValue (nếu có)
        if (voucher.getMaxOrderValue() != null && voucher.getMaxOrderValue() > 0 
                && applicableSubtotal > voucher.getMaxOrderValue()) {
            throw new AppException(ErrorCode.INVALID_VOUCHER_MINIUM, 
                    "Giá trị đơn hàng vượt quá giá trị tối đa cho phép của voucher");
        }
        
        // Kiểm tra applyScope: đảm bảo có ít nhất một sản phẩm phù hợp với scope
        if (voucher.getApplyScope() != null && voucher.getApplyScope() != DiscountApplyScope.ORDER) {
            double scopeSubtotal = calculateApplicableSubtotal(cart, voucher);
            if (scopeSubtotal <= 0) {
                throw new AppException(ErrorCode.INVALID_VOUCHER_SCOPE, 
                        "Không có sản phẩm nào trong giỏ hàng phù hợp với phạm vi áp dụng của voucher");
            }
        }

        // Tính giá trị giảm giá dựa trên loại giảm giá của voucher
        double discountValue = voucher.getDiscountValue();
        double discount;
        if (voucher.getDiscountValueType() == DiscountValueType.PERCENTAGE) {
            discount = applicableSubtotal * (discountValue / 100.0);
        } else {
            discount = discountValue;
        }
        
        // Nếu giá trị giảm giá vượt quá giá trị giảm giá tối đa của voucher, set giá trị giảm giá tối đa của voucher
        if (voucher.getMaxDiscountValue() != null && voucher.getMaxDiscountValue() > 0) {
            discount = Math.min(discount, voucher.getMaxDiscountValue());
        }
        
        // Nếu giá trị giảm giá vượt quá giá trị đơn hàng có thể áp dụng voucher, set giá trị giảm giá tối đa của voucher
        discount = Math.min(discount, applicableSubtotal);
        
        // Làm tròn tiền giảm giá về đơn vị đồng
        discount = Math.round(discount);
        
        // Lấy tổng giá trị đơn hàng để tính toán cuối cùng
        double fullSubtotal = cart.getSubtotal();

        cart.setAppliedVoucherCode(voucher.getCode());
        cart.setVoucherDiscount(discount);
        // Tổng sau voucher cũng làm tròn về đồng
        cart.setTotalAmount((double) Math.round(Math.max(0.0, fullSubtotal - discount)));
        return cartRepository.save(cart);
    }

    // Tính tổng giá trị đơn hàng có thể áp dụng voucher dựa trên phạm vi áp dụng của voucher
    private double calculateApplicableSubtotal(Cart cart, Voucher voucher) {
        if (voucher.getApplyScope() == null || voucher.getApplyScope() == DiscountApplyScope.ORDER) {
            // Áp dụng cho toàn bộ đơn hàng
            double subtotal = cart.getSubtotal() != null ? cart.getSubtotal() : 0.0;
            return Math.round(subtotal);
        }

        if (cart.getCartItems() == null || cart.getCartItems().isEmpty()) {
            return 0.0;
        }

        double applicableSubtotal = cart.getCartItems().stream()
                .filter(item -> {
                    if (item == null) {
                        return false;
                    }
                    
                    Product product = item.getProduct();
                    if (product == null) {
                        return false;
                    }

                    DiscountApplyScope scope = voucher.getApplyScope();
                    if (scope == DiscountApplyScope.PRODUCT) {
                        // Nếu sản phẩm có nằm trong danh sách sản phẩm của voucher, return true
                        if (voucher.getProductApply() == null || voucher.getProductApply().isEmpty()) {
                            return false;
                        }
                        return voucher.getProductApply().stream()
                                .anyMatch(vp -> vp != null && vp.getId() != null && vp.getId().equals(product.getId()));
                    } else if (scope == DiscountApplyScope.CATEGORY) {
                        // Nếu danh mục sản phẩm có nằm trong danh sách danh mục của voucher, return true
                        Category productCategory = product.getCategory();
                        if (productCategory == null || voucher.getCategoryApply() == null || voucher.getCategoryApply().isEmpty()) {
                            return false;
                        }
                        return voucher.getCategoryApply().stream()
                                .anyMatch(vc -> vc != null && vc.getId() != null && vc.getId().equals(productCategory.getId()));
                    }
                    return false;
                })
                .mapToDouble(item -> {
                    Double finalPrice = item.getFinalPrice();
                    return finalPrice != null ? finalPrice : 0.0;
                })
                .sum();
        
        // Làm tròn về đơn vị đồng
        return Math.round(applicableSubtotal);
    }

    @Transactional
    @PreAuthorize("hasRole('CUSTOMER')")
    public Cart updateCartItemQuantity(String cartItemId, int quantity) {
        if (quantity <= 0) {
            throw new AppException(ErrorCode.OUT_OF_STOCK);
        }

        Cart cart = getOrCreateCartForCurrentCustomer();
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new AppException(ErrorCode.CART_ITEM_NOT_EXISTED));

        // Kiểm tra cartItem thuộc về cart của user hiện tại
        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new AppException(ErrorCode.CART_ITEM_NOT_EXISTED);
        }

        // Kiểm tra tồn kho: không cho vượt quá stockQuantity nếu có
        Product product = cartItem.getProduct();
        if (product != null && product.getInventory() != null) {
            Integer stockQuantity = product.getInventory().getStockQuantity();
            if (stockQuantity != null && quantity > stockQuantity) {
                throw new AppException(ErrorCode.OUT_OF_STOCK);
            }
        }

        cartItem.setQuantity(quantity);
        double finalPrice = cartItem.getQuantity() * cartItem.getUnitPrice();
        cartItem.setFinalPrice(finalPrice);

        cartItemRepository.save(cartItem);
        recalcCartTotals(cart);
        return cart;
    }

    @Transactional
    @PreAuthorize("hasRole('CUSTOMER')")
    public Cart removeCartItem(String cartItemId) {
        Cart cart = getOrCreateCartForCurrentCustomer();
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new AppException(ErrorCode.CART_ITEM_NOT_EXISTED));

        // Kiểm tra cartItem thuộc về cart của user hiện tại
        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new AppException(ErrorCode.CART_ITEM_NOT_EXISTED);
        }

        // Xóa cartItem khỏi DB
        cartItemRepository.delete(cartItem);

        // Đồng bộ lại collection cartItems trong entity Cart hiện tại,
        // tránh việc recalcCartTotals() save lại item vừa xóa.
        if (cart.getCartItems() != null && !cart.getCartItems().isEmpty()) {
            cart.getCartItems().removeIf(item -> cartItemId.equals(item.getId()));
        }

        // Tính lại tổng tiền sau khi đã loại bỏ item vừa xóa
        recalcCartTotals(cart);
        return cart;
    }

    @Transactional
    @PreAuthorize("hasRole('CUSTOMER')")
    public Cart clearVoucher() {
        Cart cart = getOrCreateCartForCurrentCustomer();
        cart.setAppliedVoucherCode(null);
        cart.setVoucherDiscount(0.0);
        recalcCartTotals(cart);
        return cart;
    }

    @Transactional
    public void clearVoucherForUser(User user) {
        if (user == null || user.getId() == null) {
            return;
        }

        cartRepository.findByUserId(user.getId()).ifPresent(cart -> {
            cart.setAppliedVoucherCode(null);
            cart.setVoucherDiscount(0.0);
            recalcCartTotals(cart);
        });
    }

    @Transactional
    public void removeCartItemsForOrder(User user, java.util.List<String> cartItemIds) {
        if (user == null || cartItemIds == null || cartItemIds.isEmpty()) {
            return;
        }
        Cart cart = cartRepository.findByUserId(user.getId()).orElse(null);
        if (cart == null) {
            return;
        }
        
        // Xóa items khỏi collection trước để tránh lỗi khi recalcCartTotals
        if (cart.getCartItems() != null && !cart.getCartItems().isEmpty()) {
            cart.getCartItems().removeIf(item -> cartItemIds.contains(item.getId()));
        }
        
        // Sau đó mới xóa items khỏi DB
        cartItemIds.forEach(id -> cartItemRepository.findById(id).ifPresent(item -> {
            if (item.getCart() != null && item.getCart().getId().equals(cart.getId())) {
                cartItemRepository.delete(item);
            }
        }));
        
        // Tính lại tổng tiền sau khi đã loại bỏ items
        recalcCartTotals(cart);
    }
}
