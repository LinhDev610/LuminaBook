package com.lumina_book.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lumina_book.backend.entity.Voucher;
import com.lumina_book.backend.enums.VoucherStatus;

public interface VoucherRepository extends JpaRepository<Voucher, String> {
    Optional<Voucher> findByCode(String code);

    Optional<Voucher> findByCodeAndStatusAndIsActiveTrue(String code, VoucherStatus status);
}
