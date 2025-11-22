package com.lumina_book.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lumina_book.backend.entity.OrderItem;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, String> {
}


