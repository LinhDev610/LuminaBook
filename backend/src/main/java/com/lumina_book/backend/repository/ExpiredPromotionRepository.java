package com.lumina_book.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lumina_book.backend.entity.ExpiredPromotion;

@Repository
public interface ExpiredPromotionRepository extends JpaRepository<ExpiredPromotion, String> {
    boolean existsById(String id);
}

