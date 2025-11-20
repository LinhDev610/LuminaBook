package com.lumina_book.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lumina_book.backend.entity.Order;

public interface OrderRepository extends JpaRepository<Order, String> {

    /**
     * Tìm các đơn hàng theo email của user (subject của JWT).
     */
    List<Order> findByUserEmail(String email);

    /**
     * Tìm đơn hàng gắn với một giỏ hàng cụ thể.
     * Do mapping @OneToOne nên tối đa chỉ có 1 đơn cho mỗi cart.
     */
    Optional<Order> findByCartId(String cartId);
}
