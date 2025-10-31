package com.lumina_book.backend.repository;

import com.lumina_book.backend.entity.Voucher;
import com.lumina_book.backend.enums.VoucherStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface VoucherRepository extends JpaRepository<Voucher, String> {
    Optional<Voucher> findByCode(String code);
    Optional<Voucher> findByCodeAndStatusAndIsActiveTrue(String code, VoucherStatus status);
}


