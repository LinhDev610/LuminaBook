package com.lumina_book.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lumina_book.backend.dto.response.PaymentRevenue;
import com.lumina_book.backend.dto.response.ProductRevenue;
import com.lumina_book.backend.dto.response.RevenuePoint;
import com.lumina_book.backend.entity.FinancialRecord;
import com.lumina_book.backend.entity.Order;
import com.lumina_book.backend.entity.Product;
import com.lumina_book.backend.enums.FinancialRecordType;
import com.lumina_book.backend.enums.PaymentMethod;
import com.lumina_book.backend.repository.FinancialRecordRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FinancialService {

    FinancialRecordRepository financialRecordRepository;

    @Transactional
    public void recordRevenue(Order order, Product product, double amount, PaymentMethod method) {
        FinancialRecord rec = FinancialRecord.builder()
                .order(order)
                .product(product)
                .amount(amount)
                .paymentMethod(method)
                .recordType(FinancialRecordType.ORDER_PAYMENT)
                .occurredAt(LocalDateTime.now())
                .build();
        financialRecordRepository.save(rec);
    }

    public List<RevenuePoint> revenueByDay(LocalDate start, LocalDate end) {
        LocalDateTime s = start.atStartOfDay();
        LocalDateTime e = end.atTime(LocalTime.MAX);
        return financialRecordRepository.revenueByDay(FinancialRecordType.ORDER_PAYMENT, s, e).stream()
                .map(r -> new RevenuePoint((LocalDate) r[0], ((Number) r[1]).doubleValue()))
                .toList();
    }

    public List<ProductRevenue> revenueByProduct(LocalDate start, LocalDate end) {
        LocalDateTime s = start.atStartOfDay();
        LocalDateTime e = end.atTime(LocalTime.MAX);
        return financialRecordRepository.revenueByProduct(FinancialRecordType.ORDER_PAYMENT, s, e).stream()
                .map(r -> new ProductRevenue((String) r[0], (String) r[1], ((Number) r[2]).doubleValue()))
                .toList();
    }

    public List<PaymentRevenue> revenueByPayment(LocalDate start, LocalDate end) {
        LocalDateTime s = start.atStartOfDay();
        LocalDateTime e = end.atTime(LocalTime.MAX);
        return financialRecordRepository.revenueByPayment(FinancialRecordType.ORDER_PAYMENT, s, e).stream()
                .map(r -> new PaymentRevenue((PaymentMethod) r[0], ((Number) r[1]).doubleValue()))
                .toList();
    }
}
