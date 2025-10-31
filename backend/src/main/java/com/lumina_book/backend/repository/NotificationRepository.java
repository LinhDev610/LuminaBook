package com.lumina_book.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lumina_book.backend.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, String> {}
