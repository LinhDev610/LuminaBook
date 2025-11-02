package com.lumina_book.backend.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.lumina_book.backend.dto.request.ApiResponse;
import com.lumina_book.backend.dto.response.PaymentRevenue;
import com.lumina_book.backend.dto.response.ProductRevenue;
import com.lumina_book.backend.dto.response.RevenuePoint;
import com.lumina_book.backend.service.FinancialService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/financial")
@RequiredArgsConstructor
public class FinancialController {

    private final FinancialService financialService;

    @GetMapping("/revenue/day")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<RevenuePoint>> revenueByDay(@RequestParam LocalDate start, @RequestParam LocalDate end) {
        return ApiResponse.<List<RevenuePoint>>builder()
                .result(financialService.revenueByDay(start, end))
                .build();
    }

    @GetMapping("/revenue/product")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<ProductRevenue>> revenueByProduct(
            @RequestParam LocalDate start, @RequestParam LocalDate end) {
        return ApiResponse.<List<ProductRevenue>>builder()
                .result(financialService.revenueByProduct(start, end))
                .build();
    }

    @GetMapping("/revenue/payment")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<PaymentRevenue>> revenueByPayment(
            @RequestParam LocalDate start, @RequestParam LocalDate end) {
        return ApiResponse.<List<PaymentRevenue>>builder()
                .result(financialService.revenueByPayment(start, end))
                .build();
    }
}
