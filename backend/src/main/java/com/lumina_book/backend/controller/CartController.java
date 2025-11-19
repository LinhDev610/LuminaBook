package com.lumina_book.backend.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.lumina_book.backend.dto.request.ApiResponse;
import com.lumina_book.backend.dto.response.CartResponse;
import com.lumina_book.backend.mapper.CartMapper;
import com.lumina_book.backend.service.CartService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CartController {

    CartService cartService;
    CartMapper cartMapper;

    @GetMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    ApiResponse<CartResponse> getCart() {
        var cart = cartService.getCart();
        return ApiResponse.<CartResponse>builder()
                .result(cartMapper.toResponse(cart))
                .build();
    }

    @PostMapping("/items")
    @PreAuthorize("hasRole('CUSTOMER')")
    ApiResponse<CartResponse> addItem(
            @RequestParam("productId") String productId, @RequestParam("quantity") int quantity) {
        var cart = cartService.addItem(productId, quantity);
        return ApiResponse.<CartResponse>builder()
                .result(cartMapper.toResponse(cart))
                .build();
    }

    @PutMapping("/items/{cartItemId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    ApiResponse<CartResponse> updateCartItemQuantity(
            @PathVariable String cartItemId, @RequestParam("quantity") int quantity) {
        var cart = cartService.updateCartItemQuantity(cartItemId, quantity);
        return ApiResponse.<CartResponse>builder()
                .result(cartMapper.toResponse(cart))
                .build();
    }

    @DeleteMapping("/items/{cartItemId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    ApiResponse<CartResponse> removeCartItem(@PathVariable String cartItemId) {
        var cart = cartService.removeCartItem(cartItemId);
        return ApiResponse.<CartResponse>builder()
                .result(cartMapper.toResponse(cart))
                .build();
    }

    @PostMapping("/apply-voucher")
    @PreAuthorize("hasRole('CUSTOMER')")
    ApiResponse<CartResponse> applyVoucher(@RequestParam("code") String code) {
        var cart = cartService.applyVoucher(code);
        return ApiResponse.<CartResponse>builder()
                .result(cartMapper.toResponse(cart))
                .build();
    }

    @PostMapping("/clear-voucher")
    @PreAuthorize("hasRole('CUSTOMER')")
    ApiResponse<CartResponse> clearVoucher() {
        var cart = cartService.clearVoucher();
        return ApiResponse.<CartResponse>builder()
                .result(cartMapper.toResponse(cart))
                .build();
    }
}
