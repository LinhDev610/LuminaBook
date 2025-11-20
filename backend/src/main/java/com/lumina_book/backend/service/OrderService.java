package com.lumina_book.backend.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lumina_book.backend.dto.request.CreateOrderRequest;
import com.lumina_book.backend.entity.Cart;
import com.lumina_book.backend.entity.CartItem;
import com.lumina_book.backend.entity.Order;
import com.lumina_book.backend.enums.OrderStatus;
import com.lumina_book.backend.exception.AppException;
import com.lumina_book.backend.exception.ErrorCode;
import com.lumina_book.backend.repository.OrderRepository;
import com.lumina_book.backend.util.SecurityUtil;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderService {

    OrderRepository orderRepository;
    CartService cartService;

    /**
     * Tạo đơn hàng mới từ giỏ hàng hiện tại của khách hàng.
     */
    @Transactional
    @PreAuthorize("hasRole('CUSTOMER')")
    public Order createOrderFromCurrentCart(CreateOrderRequest request) {
        Cart cart = cartService.getCart();
        if (cart.getCartItems() == null || cart.getCartItems().isEmpty()) {
            throw new AppException(ErrorCode.CART_ITEM_NOT_EXISTED);
        }

        // Xác định các CartItem được chọn để thanh toán
        List<String> requestedIds = request.getCartItemIds();
        List<CartItem> allItems = cart.getCartItems();

        List<CartItem> selectedItems;
        if (requestedIds != null && !requestedIds.isEmpty()) {
            Set<String> idSet = requestedIds.stream().collect(Collectors.toSet());
            selectedItems = allItems.stream()
                    .filter(ci -> idSet.contains(ci.getId()))
                    .collect(Collectors.toList());

            if (selectedItems.isEmpty()) {
                throw new AppException(ErrorCode.CART_ITEM_NOT_EXISTED);
            }
        } else {
            // Không truyền cartItemIds => mặc định thanh toán toàn bộ giỏ hàng
            selectedItems = allItems;
        }

        double shippingFee = request.getShippingFee() != null ? request.getShippingFee() : 0.0;

        // Tạm tính cho các item được chọn
        double selectedSubtotal = selectedItems.stream()
                .mapToDouble(ci -> ci.getFinalPrice() != null ? ci.getFinalPrice() : 0.0)
                .sum();

        // Áp dụng toàn bộ voucherDiscount hiện tại cho phần được chọn (giống logic FE)
        Double rawVoucherDiscount = cart.getVoucherDiscount();
        double voucherDiscount = rawVoucherDiscount == null ? 0.0 : rawVoucherDiscount;

        double orderTotal = Math.max(0.0, selectedSubtotal + shippingFee - voucherDiscount);

        Order order = Order.builder()
                .user(cart.getUser())
                // Không gắn cart trực tiếp để tránh ràng buộc 1 cart - nhiều order,
                // order sẽ lưu tổng tiền còn cart chỉ là giỏ hiện tại.
                .code(generateOrderCode())
                .note(request.getNote())
                .shippingAddress(request.getShippingAddress())
                .orderDate(LocalDate.now())
                .shippingFee(shippingFee)
                .totalAmount(orderTotal)
                .status(OrderStatus.CREATED)
                .build();

        Order savedOrder = orderRepository.save(order);

        // Sau khi tạo đơn hàng thành công: xóa các CartItem đã thanh toán khỏi giỏ
        for (CartItem item : selectedItems) {
            cartService.removeCartItem(item.getId());
        }

        return savedOrder;
    }

    /**
     * Sinh mã đơn hàng dạng dễ đọc cho khách, đảm bảo gần như không trùng.
     * Ví dụ: LMN20241120-AB1234
     */
    private String generateOrderCode() {
        String datePart = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE); // yyyyMMdd
        String randomPart = UUID.randomUUID()
                .toString()
                .replace("-", "")
                .toUpperCase(Locale.ROOT)
                .substring(0, 6);
        return "LMN" + datePart + "-" + randomPart;
    }

    /**
     * Danh sách tất cả đơn hàng cho nhân viên / admin.
     */
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    /**
     * Danh sách đơn hàng của chính khách hàng hiện đang đăng nhập.
     */
    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('CUSTOMER')")
    public List<Order> getMyOrders() {
        String email = SecurityUtil.getAuthentication().getName();
        return orderRepository.findByUserEmail(email);
    }
}


