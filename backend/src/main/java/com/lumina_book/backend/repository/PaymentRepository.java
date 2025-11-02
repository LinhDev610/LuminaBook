package com.lumina_book.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lumina_book.backend.entity.Payment;

public interface PaymentRepository extends JpaRepository<Payment, String> {}
