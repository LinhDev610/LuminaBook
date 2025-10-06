package com.lumina_book.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lumina_book.backend.entity.InvalidatedToken;

// Lưu trữ token hết hạn
@Repository
public interface InvalidatedTokenRepository extends JpaRepository<InvalidatedToken, String> {}
