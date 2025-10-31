package com.lumina_book.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lumina_book.backend.entity.SupportTicket;
import com.lumina_book.backend.enums.TicketStatus;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, String> {
    List<SupportTicket> findByStatus(TicketStatus status);
}
