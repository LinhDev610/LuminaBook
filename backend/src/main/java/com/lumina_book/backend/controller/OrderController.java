package com.lumina_book.backend.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lumina_book.backend.dto.request.ApiResponse;
import com.lumina_book.backend.dto.request.CreateOrderRequest;
import com.lumina_book.backend.dto.request.DirectCheckoutRequest;
import com.lumina_book.backend.dto.request.ReturnProcessRequest;
import com.lumina_book.backend.dto.response.CheckoutInitResponse;
import com.lumina_book.backend.dto.response.OrderDetailResponse;
import com.lumina_book.backend.dto.response.OrderItemResponse;
import com.lumina_book.backend.dto.response.OrderResponse;
import com.lumina_book.backend.dto.response.OrderStatistics;
import com.lumina_book.backend.dto.response.OrderPageResponse;
import com.lumina_book.backend.entity.Address;
import com.lumina_book.backend.entity.Order;
import com.lumina_book.backend.service.OrderService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class OrderController {

    OrderService orderService;
    ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/checkout")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ApiResponse<CheckoutInitResponse> createOrder(@RequestBody CreateOrderRequest request) {
        OrderService.CheckoutResult result = orderService.createOrderFromCurrentCart(request);
        CheckoutInitResponse response = CheckoutInitResponse.builder()
                .order(result.getOrder() != null ? toResponse(result.getOrder()) : null)
                .payUrl(result.getPayUrl())
                .orderCode(result.getOrderCode()) // For MoMo: order code to be created after payment
                .build();
        return ApiResponse.<CheckoutInitResponse>builder()
                .result(response)
                .build();
    }

    @PostMapping("/checkout-direct")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ApiResponse<CheckoutInitResponse> createOrderDirectly(@RequestBody DirectCheckoutRequest request) {
        OrderService.CheckoutResult result = orderService.createOrderDirectly(request);
        CheckoutInitResponse response = CheckoutInitResponse.builder()
                .order(result.getOrder() != null ? toResponse(result.getOrder()) : null)
                .payUrl(result.getPayUrl())
                .orderCode(result.getOrderCode()) // For MoMo: order code to be created after payment
                .build();
        return ApiResponse.<CheckoutInitResponse>builder()
                .result(response)
                .build();
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ApiResponse<List<OrderResponse>> getAllOrders() {
        List<Order> orders = orderService.getAllOrders();
        return ApiResponse.<List<OrderResponse>>builder()
                .result(orders.stream().map(this::toResponse).toList())
                .build();
    }

    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<OrderStatistics> getOrderStatistics(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end) {
        return ApiResponse.<OrderStatistics>builder()
                .result(orderService.getOrderStatistics(start, end))
                .build();
    }

    @GetMapping("/recent")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<OrderPageResponse> getRecentOrders(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var orderPage = orderService.getOrdersByDateRangePage(start, end, page, size);
        
        OrderPageResponse response = OrderPageResponse.builder()
                .orders(orderPage.getContent().stream().map(this::toResponse).toList())
                .totalElements(orderPage.getTotalElements())
                .totalPages(orderPage.getTotalPages())
                .currentPage(orderPage.getNumber())
                .pageSize(orderPage.getSize())
                .hasNext(orderPage.hasNext())
                .hasPrevious(orderPage.hasPrevious())
                .build();
        
        return ApiResponse.<OrderPageResponse>builder()
                .result(response)
                .build();
    }

    @GetMapping("/my-orders")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ApiResponse<List<OrderResponse>> getMyOrders() {
        List<Order> orders = orderService.getMyOrders();
        return ApiResponse.<List<OrderResponse>>builder()
                .result(orders.stream().map(this::toResponse).toList())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<OrderDetailResponse> getOrderById(@PathVariable String id) {
        Order order = orderService.getOrderByIdForCurrentUser(id);
        return ApiResponse.<OrderDetailResponse>builder()
                .result(toDetailResponse(order))
                .build();
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ApiResponse<OrderDetailResponse> confirmOrder(@PathVariable String id) {
        Order order = orderService.confirmOrder(id);
        return ApiResponse.<OrderDetailResponse>builder()
                .result(toDetailResponse(order))
                .build();
    }

    /**
     * Test endpoint để gửi lại email xác nhận đơn hàng
     * Chỉ dùng cho testing/debugging
     */
    @PostMapping("/{id}/resend-email")
    @PreAuthorize("hasAnyRole('CUSTOMER','STAFF','ADMIN')")
    public ApiResponse<String> resendOrderConfirmationEmail(@PathVariable String id) {
        orderService.sendOrderConfirmationEmailForTesting(id);
        return ApiResponse.<String>builder()
                .result("Email đã được gửi lại")
                .build();
    }

    @PostMapping("/{id}/verify-payment")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ApiResponse<Void> verifyPaymentAndSendEmail(@PathVariable String id) {
        orderService.verifyPaymentAndSendEmail(id);
        return ApiResponse.<Void>builder()
                .message("Đã xác minh thanh toán và gửi email xác nhận.")
                .build();
    }

    /**
     * Tạo đơn hàng sau khi thanh toán MoMo thành công (từ giỏ hàng).
     * Endpoint này được gọi từ OrderSuccessPage khi resultCode = '0'.
     */
    @PostMapping("/create-after-payment")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ApiResponse<OrderDetailResponse> createOrderAfterPayment(
            @RequestBody CreateOrderRequest request) {
        Order order = orderService.createOrderFromCurrentCartAfterPayment(request);
        return ApiResponse.<OrderDetailResponse>builder()
                .result(toDetailResponse(order))
                .message("Đơn hàng đã được tạo thành công sau khi thanh toán.")
                .build();
    }


     // Tạo đơn hàng trực tiếp sau khi thanh toán MoMo thành công.

    @PostMapping("/create-direct-after-payment")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ApiResponse<OrderDetailResponse> createOrderDirectlyAfterPayment(
            @RequestBody DirectCheckoutRequest request) {
        Order order = orderService.createOrderDirectlyAfterPayment(request);
        return ApiResponse.<OrderDetailResponse>builder()
                .result(toDetailResponse(order))
                .message("Đơn hàng đã được tạo thành công sau khi thanh toán.")
                .build();
    }

    @PostMapping("/{id}/request-return")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ApiResponse<OrderDetailResponse> requestReturn(
            @PathVariable String id,
            @RequestBody(required = false) com.lumina_book.backend.dto.request.ReturnRequestRequest request) {
        Order order = orderService.requestReturn(id, request);
        return ApiResponse.<OrderDetailResponse>builder()
                .result(toDetailResponse(order))
                .message("Đã gửi yêu cầu trả hàng/hoàn tiền thành công.")
                .build();
    }


     // Lấy danh sách các yêu cầu trả hàng/hoàn tiền.
     // Dành cho Customer Support để quản lý và xử lý các yêu cầu trả hàng từ khách hàng.

    @GetMapping("/return-requests")
    @PreAuthorize("hasAnyRole('CUSTOMER_SUPPORT','STAFF','ADMIN')")
    public ApiResponse<List<OrderResponse>> getReturnRequests() {
        List<Order> orders = orderService.getReturnRequests();
        return ApiResponse.<List<OrderResponse>>builder()
                .result(orders.stream().map(this::toResponse).toList())
                .build();
    }

    @PostMapping("/{id}/reject-refund")
    @PreAuthorize("hasAnyRole('CUSTOMER_SUPPORT','STAFF','ADMIN')")
    public ApiResponse<OrderDetailResponse> rejectRefund(
            @PathVariable String id,
            @RequestBody com.lumina_book.backend.dto.request.RejectRefundRequest request) {
        Order order = orderService.rejectRefund(id, request);
        return ApiResponse.<OrderDetailResponse>builder()
                .result(toDetailResponse(order))
                .message("Đã từ chối yêu cầu hoàn tiền thành công.")
                .build();
    }

    @PostMapping("/{id}/cs-confirm-refund")
    @PreAuthorize("hasAnyRole('CUSTOMER_SUPPORT','STAFF','ADMIN')")
    public ApiResponse<OrderDetailResponse> csConfirmRefund(
            @PathVariable String id,
            @RequestBody(required = false) ReturnProcessRequest request) {
        Order order = orderService.csConfirmReturn(id, request);
        return ApiResponse.<OrderDetailResponse>builder()
                .result(toDetailResponse(order))
                .message("CSKH đã xác nhận đơn hoàn và chuyển cho bộ phận kho.")
                .build();
    }

    @PostMapping("/{id}/staff-confirm-refund")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ApiResponse<OrderDetailResponse> staffConfirmRefund(
            @PathVariable String id,
            @RequestBody(required = false) ReturnProcessRequest request) {
        Order order = orderService.staffConfirmReturn(id, request);
        return ApiResponse.<OrderDetailResponse>builder()
                .result(toDetailResponse(order))
                .message("Kho đã xác nhận kiểm tra đơn hoàn và chuyển cho Admin.")
                .build();
    }

    @PostMapping("/{id}/confirm-refund")
    @PreAuthorize("hasAnyRole('CUSTOMER_SUPPORT','STAFF','ADMIN')")
    public ApiResponse<OrderDetailResponse> confirmRefund(
            @PathVariable String id,
            @RequestBody(required = false) ReturnProcessRequest request) {
        Order order = orderService.confirmRefund(id, request);
        return ApiResponse.<OrderDetailResponse>builder()
                .result(toDetailResponse(order))
                .message("Đã xác nhận yêu cầu hoàn tiền thành công.")
                .build();
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('CUSTOMER','STAFF','ADMIN')")
    public ApiResponse<OrderDetailResponse> cancelOrder(
            @PathVariable String id,
            @RequestBody(required = false) com.lumina_book.backend.dto.request.CancelOrderRequest request) {
        String reason = request != null ? request.getReason() : null;
        Order order = orderService.cancelOrder(id, reason);
        return ApiResponse.<OrderDetailResponse>builder()
                .result(toDetailResponse(order))
                .message("Đơn hàng đã được hủy thành công.")
                .build();
    }

    private OrderResponse toResponse(Order order) {
        if (order == null) {
            return null;
        }
        String customerName = "Khách hàng";
        String customerEmail = null;
        if (order.getUser() != null) {
            customerEmail = order.getUser().getEmail();
            String fullName = order.getUser().getFullName();
            if (fullName != null && !fullName.isBlank()) {
                customerName = fullName;
            } else if (customerEmail != null) {
                customerName = customerEmail;
            }
        }

        return OrderResponse.builder()
                .id(order.getId())
                .code(order.getCode() != null ? order.getCode() : order.getId())
                .customerName(customerName)
                .customerEmail(customerEmail)
                .cancellationReason(resolveCancellationReason(order))
                .cancellationSource(resolveCancellationSource(order))
                .receiverName(resolveReceiverName(order, customerName))
                .receiverPhone(resolveReceiverPhone(order))
                .shippingAddress(resolveShippingAddressText(order))
                .orderDate(order.getOrderDate())
                .orderDateTime(resolveOrderDateTime(order))
                .shippingFee(order.getShippingFee())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus() != null ? order.getStatus().name() : null)
                .paymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod().name() : null)
                .paymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : null)
                .paid(order.getPaid())
                .paymentReference(order.getPaymentReference())
                .refundReasonType(order.getRefundReasonType())
                .refundDescription(order.getRefundDescription())
                .refundEmail(order.getRefundEmail())
                .refundReturnAddress(order.getRefundReturnAddress())
                .refundMethod(order.getRefundMethod())
                .refundBank(order.getRefundBank())
                .refundAccountNumber(order.getRefundAccountNumber())
                .refundAccountHolder(order.getRefundAccountHolder())
                .refundAmount(order.getRefundAmount())
                .refundReturnFee(order.getRefundReturnFee())
                .refundSecondShippingFee(order.getRefundSecondShippingFee())
                .refundPenaltyAmount(order.getRefundPenaltyAmount())
                .refundTotalPaid(order.getRefundTotalPaid())
                .refundConfirmedAmount(order.getRefundConfirmedAmount())
                .refundConfirmedPenalty(order.getRefundConfirmedPenalty())
                .refundConfirmedSecondShippingFee(order.getRefundConfirmedSecondShippingFee())
                .returnCheckedDate(order.getReturnCheckedDate())
                .refundRejectionSource(order.getRefundRejectionSource())
                .adminProcessingNote(order.getAdminProcessingNote())
                .build();
    }

    private OrderDetailResponse toDetailResponse(Order order) {
        if (order == null) {
            return null;
        }
        String customerName = "Khách hàng";
        String customerEmail = null;
        if (order.getUser() != null) {
            customerEmail = order.getUser().getEmail();
            String fullName = order.getUser().getFullName();
            if (fullName != null && !fullName.isBlank()) {
                customerName = fullName;
            } else if (customerEmail != null) {
                customerName = customerEmail;
            }
        }

        List<OrderItemResponse> items = order.getItems() == null
                ? List.of()
                : order.getItems().stream()
                        .map(oi -> {
                            String imageUrl = null;
                            if (oi.getProduct() != null) {
                                // Lấy ảnh từ defaultMedia hoặc mediaList đầu tiên
                                if (oi.getProduct().getDefaultMedia() != null) {
                                    imageUrl = oi.getProduct().getDefaultMedia().getMediaUrl();
                                } else if (oi.getProduct().getMediaList() != null 
                                        && !oi.getProduct().getMediaList().isEmpty()) {
                                    imageUrl = oi.getProduct().getMediaList().get(0).getMediaUrl();
                                }
                            }
                            return OrderItemResponse.builder()
                                    .id(oi.getId())
                                    .productId(oi.getProduct() != null ? oi.getProduct().getId() : null)
                                    .name(oi.getProduct() != null ? oi.getProduct().getName() : null)
                                    .imageUrl(imageUrl)
                                    .quantity(oi.getQuantity())
                                    .unitPrice(oi.getUnitPrice())
                                    .totalPrice(oi.getFinalPrice())
                                    .build();
                        })
                        .collect(Collectors.toList());

        return OrderDetailResponse.builder()
                .id(order.getId())
                .code(order.getCode() != null ? order.getCode() : order.getId())
                .customerName(customerName)
                .customerEmail(customerEmail)
                .cancellationReason(resolveCancellationReason(order))
                .cancellationSource(resolveCancellationSource(order))
                .receiverName(resolveReceiverName(order, customerName))
                .receiverPhone(resolveReceiverPhone(order))
                .shippingAddress(resolveShippingAddressText(order))
                .orderDate(order.getOrderDate())
                .orderDateTime(resolveOrderDateTime(order))
                .shippingFee(order.getShippingFee())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus() != null ? order.getStatus().name() : null)
                .paymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod().name() : null)
                .paymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : null)
                .paid(order.getPaid())
                .paymentReference(order.getPaymentReference())
                .items(items)
                .refundReasonType(order.getRefundReasonType())
                .refundDescription(order.getRefundDescription())
                .refundEmail(order.getRefundEmail())
                .refundReturnAddress(order.getRefundReturnAddress())
                .refundMethod(order.getRefundMethod())
                .refundBank(order.getRefundBank())
                .refundAccountNumber(order.getRefundAccountNumber())
                .refundAccountHolder(order.getRefundAccountHolder())
                .refundAmount(order.getRefundAmount())
                .refundReturnFee(order.getRefundReturnFee())
                .refundSecondShippingFee(order.getRefundSecondShippingFee())
                .refundPenaltyAmount(order.getRefundPenaltyAmount())
                .refundTotalPaid(order.getRefundTotalPaid())
                .refundConfirmedAmount(order.getRefundConfirmedAmount())
                .refundConfirmedPenalty(order.getRefundConfirmedPenalty())
                .refundConfirmedSecondShippingFee(order.getRefundConfirmedSecondShippingFee())
                .returnCheckedDate(order.getReturnCheckedDate())
                .refundSelectedProductIds(order.getRefundSelectedProductIds())
                .refundMediaUrls(order.getRefundMediaUrls())
                .refundRejectionReason(order.getRefundRejectionReason())
                .refundRejectionSource(order.getRefundRejectionSource())
                .staffInspectionResult(order.getStaffInspectionResult())
                .adminProcessingNote(order.getAdminProcessingNote())
                .build();
    }

    private String resolveReceiverName(Order order, String fallback) {
        ShippingSnapshot snapshot = parseShippingSnapshot(order.getShippingAddress());
        if (snapshot.name != null && !snapshot.name.isBlank()) {
            return snapshot.name;
        }
        if (order.getAddress() != null && order.getAddress().getRecipientName() != null
                && !order.getAddress().getRecipientName().isBlank()) {
            return order.getAddress().getRecipientName();
        }
        return fallback;
    }

    private String resolveReceiverPhone(Order order) {
        ShippingSnapshot snapshot = parseShippingSnapshot(order.getShippingAddress());
        if (snapshot.phone != null && !snapshot.phone.isBlank()) {
            return snapshot.phone;
        }
        if (order.getAddress() != null && order.getAddress().getRecipientPhoneNumber() != null
                && !order.getAddress().getRecipientPhoneNumber().isBlank()) {
            return order.getAddress().getRecipientPhoneNumber();
        }
        return "";
    }

    private String resolveShippingAddressText(Order order) {
        ShippingSnapshot snapshot = parseShippingSnapshot(order.getShippingAddress());
        if (snapshot.address != null && !snapshot.address.isBlank()) {
            return snapshot.address;
        }
        if (order.getAddress() != null) {
            return buildAddressText(order.getAddress());
        }
        return order.getShippingAddress();
    }

    private ShippingSnapshot parseShippingSnapshot(String raw) {
        ShippingSnapshot snapshot = new ShippingSnapshot();
        if (raw == null || raw.isBlank()) {
            return snapshot;
        }
        try {
            JsonNode node = objectMapper.readTree(raw);
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
                    node.path("addressText").asText(null),
                    node.path("fullAddress").asText(null),
                    raw);
        } catch (Exception e) {
            snapshot.address = raw;
        }
        return snapshot;
    }

    private String buildAddressText(Address address) {
        if (address == null) return "";
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

    private String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private String resolveCancellationReason(Order order) {
        if (order == null) {
            return null;
        }
        if (order.getCancellationReason() != null && !order.getCancellationReason().isBlank()) {
            return order.getCancellationReason();
        }
        String note = order.getNote();
        if (note == null || note.isBlank()) {
            return null;
        }
        String lower = note.toLowerCase();
        if (!lower.contains("hủy") && !lower.contains("huy")) {
            return null;
        }

        // Lý do: ...
        int idx = lower.indexOf("lý do");
        if (idx < 0) {
            idx = lower.indexOf("ly do");
        }
        if (idx >= 0) {
            String candidate = note.substring(idx);
            candidate = candidate.replaceFirst("(?i)lý do[:\\s-]*", "").trim();
            if (!candidate.isBlank()) {
                return candidate;
            }
        }
        return note;
    }

    private String resolveCancellationSource(Order order) {
        if (order == null || order.getCancellationSource() == null) {
            return null;
        }
        return order.getCancellationSource().name();
    }

    private LocalDateTime resolveOrderDateTime(Order order) {
        if (order.getOrderDateTime() != null) {
            return order.getOrderDateTime();
        }
        if (order.getOrderDate() != null) {
            return order.getOrderDate().atStartOfDay();
        }
        return null;
    }

    private static class ShippingSnapshot {
        String name;
        String phone;
        String address;
    }
}


