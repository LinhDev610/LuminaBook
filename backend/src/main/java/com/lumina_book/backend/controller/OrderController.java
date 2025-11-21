package com.lumina_book.backend.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.lumina_book.backend.dto.request.ApiResponse;
import com.lumina_book.backend.dto.request.CreateOrderRequest;
import com.lumina_book.backend.dto.response.OrderResponse;
import com.lumina_book.backend.dto.response.OrderDetailResponse;
import com.lumina_book.backend.dto.response.OrderItemResponse;
import com.lumina_book.backend.entity.Order;
import com.lumina_book.backend.service.OrderService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderController {

    OrderService orderService;

    @PostMapping("/checkout")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ApiResponse<OrderResponse> createOrder(@RequestBody CreateOrderRequest request) {
        Order order = orderService.createOrderFromCurrentCart(request);
        return ApiResponse.<OrderResponse>builder()
                .result(toResponse(order))
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

    @GetMapping("/my-orders")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ApiResponse<List<OrderResponse>> getMyOrders() {
        List<Order> orders = orderService.getMyOrders();
        return ApiResponse.<List<OrderResponse>>builder()
                .result(orders.stream().map(this::toResponse).toList())
                .build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER','STAFF','ADMIN')")
    public ApiResponse<OrderDetailResponse> getOrderById(@PathVariable String id) {
        Order order = orderService.getOrderByIdForCurrentUser(id);
        return ApiResponse.<OrderDetailResponse>builder()
                .result(toDetailResponse(order))
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
                .orderDate(order.getOrderDate())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus() != null ? order.getStatus().name() : null)
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
                .shippingAddress(order.getShippingAddress())
                .orderDate(order.getOrderDate())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus() != null ? order.getStatus().name() : null)
                .items(items)
                .build();
    }
}


