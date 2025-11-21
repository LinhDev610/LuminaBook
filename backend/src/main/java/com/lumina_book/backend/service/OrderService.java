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
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.lumina_book.backend.entity.Address;
import com.lumina_book.backend.entity.Cart;
import com.lumina_book.backend.entity.CartItem;
import com.lumina_book.backend.entity.Order;
import com.lumina_book.backend.entity.OrderItem;
import com.lumina_book.backend.entity.User;
import com.lumina_book.backend.enums.OrderStatus;
import com.lumina_book.backend.exception.AppException;
import com.lumina_book.backend.exception.ErrorCode;
import com.lumina_book.backend.repository.AddressRepository;
import com.lumina_book.backend.repository.OrderRepository;
import com.lumina_book.backend.repository.OrderItemRepository;
import com.lumina_book.backend.util.SecurityUtil;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderService {

    OrderRepository orderRepository;
    OrderItemRepository orderItemRepository;
    AddressRepository addressRepository;
    CartService cartService;

    ObjectMapper objectMapper = new ObjectMapper();

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

        // Đảm bảo các thành phần là số nguyên đồng
        selectedSubtotal = Math.round(selectedSubtotal);
        shippingFee = Math.round(shippingFee);
        voucherDiscount = Math.round(voucherDiscount);

        double rawOrderTotal = selectedSubtotal + shippingFee - voucherDiscount;
        double orderTotal = Math.round(Math.max(0.0, rawOrderTotal));

        Address shippingAddressEntity = resolveShippingAddress(request, cart.getUser());
        String shippingAddressSnapshot = buildShippingAddressSnapshot(
                shippingAddressEntity,
                request.getShippingAddress(),
                cart.getUser());

        Order order = Order.builder()
                .user(cart.getUser())
                // Không gắn cart trực tiếp để tránh ràng buộc 1 cart - nhiều order,
                // order sẽ lưu tổng tiền còn cart chỉ là giỏ hiện tại.
                .code(generateOrderCode())
                .note(request.getNote())
                .shippingAddress(shippingAddressSnapshot)
                .address(shippingAddressEntity)
                .orderDate(LocalDate.now())
                .shippingFee(shippingFee)
                .totalAmount(orderTotal)
                .status(OrderStatus.CREATED)
                .build();

        Order savedOrder = orderRepository.save(order);

        // Tạo các OrderItem tương ứng với CartItem đã chọn, lưu lại ảnh snapshot sản phẩm
        List<OrderItem> orderItems = selectedItems.stream()
                .map(ci -> OrderItem.builder()
                        .order(savedOrder)
                        .product(ci.getProduct())
                        .quantity(ci.getQuantity())
                        .unitPrice(ci.getUnitPrice())
                        .finalPrice(ci.getFinalPrice())
                        .build())
                .toList();

        orderItemRepository.saveAll(orderItems);
        savedOrder.setItems(orderItems);

        // Sau khi tạo đơn hàng thành công: xóa các CartItem đã thanh toán khỏi giỏ
        for (CartItem item : selectedItems) {
            cartService.removeCartItem(item.getId());
        }

        return savedOrder;
    }

    private Address resolveShippingAddress(CreateOrderRequest request, User user) {
        if (request.getAddressId() == null || request.getAddressId().isBlank()) {
            return null;
        }
        Address address = addressRepository.findById(request.getAddressId())
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_EXISTED));

        if (user != null && address.getUsers() != null) {
            boolean belongsToUser = address.getUsers().stream()
                    .anyMatch(u -> u != null && u.getId().equals(user.getId()));
            if (!belongsToUser) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
        }
        return address;
    }

    private String buildShippingAddressSnapshot(Address address, String rawSnapshot, User user) {
        ShippingSnapshot incoming = parseSnapshot(rawSnapshot);
        ObjectNode node = objectMapper.createObjectNode();

        if (address != null) {
            node.put("addressId", address.getAddressId());
        }

        String resolvedName = firstNonBlank(
                incoming.name,
                address != null ? address.getRecipientName() : null,
                safeValue(null, user));

        String resolvedPhone = firstNonBlank(
                incoming.phone,
                address != null ? address.getRecipientPhoneNumber() : null,
                "");

        String resolvedAddress = firstNonBlank(
                incoming.address,
                address != null ? buildAddressText(address) : null,
                rawSnapshot);

        node.put("name", resolvedName);
        node.put("phone", resolvedPhone);
        node.put("address", resolvedAddress != null ? resolvedAddress : "");

        try {
            return objectMapper.writeValueAsString(node);
        } catch (JsonProcessingException e) {
            return rawSnapshot != null ? rawSnapshot : "";
        }
    }

    private ShippingSnapshot parseSnapshot(String rawSnapshot) {
        ShippingSnapshot snapshot = new ShippingSnapshot();
        if (rawSnapshot == null || rawSnapshot.isBlank()) {
            return snapshot;
        }

        try {
            JsonNode node = objectMapper.readTree(rawSnapshot);
            snapshot.name = firstNonBlank(
                    node.path("name").asText(null),
                    node.path("receiverName").asText(null),
                    node.path("recipientName").asText(null));
            snapshot.phone = firstNonBlank(
                    node.path("phone").asText(null),
                    node.path("receiverPhone").asText(null),
                    node.path("recipientPhone").asText(null),
                    node.path("recipientPhoneNumber").asText(null));
            snapshot.address = firstNonBlank(
                    node.path("address").asText(null),
                    node.path("fullAddress").asText(null),
                    node.path("addressText").asText(null),
                    rawSnapshot);
        } catch (Exception e) {
            snapshot.address = rawSnapshot;
        }

        return snapshot;
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private String safeValue(String value, User user) {
        if (value != null && !value.isBlank()) {
            return value;
        }
        if (user != null && user.getFullName() != null && !user.getFullName().isBlank()) {
            return user.getFullName();
        }
        if (user != null && user.getEmail() != null) {
            return user.getEmail();
        }
        return "Khách hàng";
    }

    private String buildAddressText(Address address) {
        StringBuilder sb = new StringBuilder();
        appendPart(sb, address.getAddress());
        appendPart(sb, address.getWardName());
        appendPart(sb, address.getDistrictName());
        appendPart(sb, address.getProvinceName());
        appendPart(sb, address.getCountry());
        return sb.toString();
    }

    private void appendPart(StringBuilder sb, String value) {
        if (value == null || value.isBlank()) return;
        if (sb.length() > 0) {
            sb.append(", ");
        }
        sb.append(value);
    }

    private static class ShippingSnapshot {
        String name;
        String phone;
        String address;
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

    /**
     * Lấy chi tiết một đơn hàng theo id, đảm bảo:
     * - STAFF / ADMIN có thể xem mọi đơn
     * - CUSTOMER chỉ được xem đơn của chính mình
     */
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('CUSTOMER','STAFF','ADMIN')")
    public Order getOrderByIdForCurrentUser(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));

        var auth = SecurityUtil.getAuthentication();
        boolean isStaffOrAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> {
                    String role = a.getAuthority();
                    return "ROLE_STAFF".equals(role) || "ROLE_ADMIN".equals(role);
                });

        if (!isStaffOrAdmin) {
            String email = auth.getName();
            if (order.getUser() == null || order.getUser().getEmail() == null
                    || !order.getUser().getEmail().equalsIgnoreCase(email)) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
        }

        // Ensure items, products, and media are loaded to avoid lazy loading issues
        if (order.getItems() != null) {
            order.getItems().forEach(item -> {
                if (item.getProduct() != null) {
                    // Load product media
                    if (item.getProduct().getDefaultMedia() != null) {
                        item.getProduct().getDefaultMedia().getMediaUrl();
                    }
                    if (item.getProduct().getMediaList() != null) {
                        item.getProduct().getMediaList().size();
                    }
                }
            });
        }

        return order;
    }
}


