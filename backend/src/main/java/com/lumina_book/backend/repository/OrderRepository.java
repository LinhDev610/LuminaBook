package com.lumina_book.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lumina_book.backend.entity.Order;

public interface OrderRepository extends JpaRepository<Order, String> {}
