package com.lumina_book.backend.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.lumina_book.backend.dto.request.ApiResponse;
import com.lumina_book.backend.dto.request.CreateOrderRequest;
import com.lumina_book.backend.dto.response.OrderResponse;
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
}


