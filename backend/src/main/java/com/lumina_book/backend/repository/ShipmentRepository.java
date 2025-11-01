package com.lumina_book.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lumina_book.backend.entity.Shipment;

public interface ShipmentRepository extends JpaRepository<Shipment, String> {
    Optional<Shipment> findByOrderCode(String orderCode);

    @Query("select s from Shipment s where s.order.id = :orderId")
    Optional<Shipment> findByOrderId(@Param("orderId") String orderId);
}
