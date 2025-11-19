package com.lumina_book.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lumina_book.backend.dto.request.TicketCreationRequest;
import com.lumina_book.backend.dto.request.TicketUpdateRequest;
import com.lumina_book.backend.dto.response.TicketResponse;
import com.lumina_book.backend.entity.SupportTicket;
import com.lumina_book.backend.entity.User;
import com.lumina_book.backend.enums.TicketAssignee;
import com.lumina_book.backend.enums.TicketStatus;
import com.lumina_book.backend.exception.AppException;
import com.lumina_book.backend.exception.ErrorCode;
import com.lumina_book.backend.mapper.TicketMapper;
import com.lumina_book.backend.repository.SupportTicketRepository;
import com.lumina_book.backend.repository.UserRepository;
import com.lumina_book.backend.util.SecurityUtil;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TicketService {

    SupportTicketRepository supportTicketRepository;
    TicketMapper ticketMapper;
    UserRepository userRepository;

    @Transactional
    public TicketResponse create(TicketCreationRequest request) {
        SupportTicket ticket = ticketMapper.toEntity(request);
        ticket.setStatus(TicketStatus.NEW);
        ticket.setAssignedTo(TicketAssignee.CS);
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());

        SupportTicket saved = supportTicketRepository.save(ticket);
        return ticketMapper.toResponse(saved);
    }

    private TicketResponse toResponseWithHandler(SupportTicket ticket) {
        TicketResponse response = ticketMapper.toResponse(ticket);
        if (ticket.getHandlerId() != null && !ticket.getHandlerId().isEmpty()) {
            response.setHandlerId(ticket.getHandlerId());
            userRepository.findById(ticket.getHandlerId()).ifPresent(handler -> {
                response.setHandlerName(handler.getFullName() != null ? handler.getFullName() : handler.getEmail());
            });
        }
        return response;
    }

    public List<TicketResponse> listAll() {
        return supportTicketRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponseWithHandler)
                .toList();
    }

    public List<TicketResponse> listByStatus(TicketStatus status) {
        return supportTicketRepository.findByStatusOrderByCreatedAtDesc(status).stream()
                .map(this::toResponseWithHandler)
                .toList();
    }

    public TicketResponse getById(String id) {
        SupportTicket ticket =
                supportTicketRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.TICKET_NOT_EXISTED));
        return toResponseWithHandler(ticket);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','CUSTOMER_SUPPORT')")
    public TicketResponse update(String id, TicketUpdateRequest request) {
        SupportTicket ticket =
                supportTicketRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.TICKET_NOT_EXISTED));
        
        // Get current user from security context
        Authentication authentication = SecurityUtil.getAuthentication();
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        
        // If CSKH saves a note (tiếp nhận khiếu nại), automatically assign to them
        if (request.getHandlerNote() != null && currentUser.getRole() != null 
                && currentUser.getRole().getName().equals("CUSTOMER_SUPPORT")) {
            
            // Check if ticket already has a handler
            boolean hasHandler = (ticket.getHandlerId() != null && !ticket.getHandlerId().isEmpty());
            
            if (!hasHandler) {
                // No handler yet - check if ticket is resolved
                if (ticket.getStatus() == TicketStatus.RESOLVED) {
                    throw new AppException(ErrorCode.UNAUTHORIZED);
                }
                // Allow this CSKH to accept the complaint
                ticket.setHandlerNote(request.getHandlerNote());
                ticket.setHandlerId(currentUser.getId());
                ticket.setAssignedTo(TicketAssignee.CS);
                ticket.setStatus(TicketStatus.IN_PROGRESS);
            } else if (ticket.getHandlerId().equals(currentUser.getId())) {
                // Same handler - allow updating note (even if resolved)
                ticket.setHandlerNote(request.getHandlerNote());
            } else {
                // Different handler already exists - reject
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
        } else if (request.getHandlerNote() != null) {
            // Admin or Staff can always update note
            ticket.setHandlerNote(request.getHandlerNote());
        }
        
        if (request.getStatus() != null) {
            ticket.setStatus(TicketStatus.valueOf(request.getStatus()));
        }
        if (request.getAssignedTo() != null) {
            ticket.setAssignedTo(TicketAssignee.valueOf(request.getAssignedTo()));
        }
        ticket.setUpdatedAt(LocalDateTime.now());

        SupportTicket saved = supportTicketRepository.save(ticket);
        return toResponseWithHandler(saved);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','CUSTOMER_SUPPORT')")
    public TicketResponse escalate(String id) {
        SupportTicket ticket =
                supportTicketRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.TICKET_NOT_EXISTED));
        ticket.setAssignedTo(TicketAssignee.ADMIN);
        ticket.setStatus(TicketStatus.ESCALATED);
        ticket.setUpdatedAt(LocalDateTime.now());
        SupportTicket saved = supportTicketRepository.save(ticket);
        return toResponseWithHandler(saved);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','CUSTOMER_SUPPORT')")
    public TicketResponse resolve(String id, String handlerNote) {
        SupportTicket ticket =
                supportTicketRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.TICKET_NOT_EXISTED));
        
        // Get current user from security context
        Authentication authentication = SecurityUtil.getAuthentication();
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        
        if (handlerNote != null) {
            ticket.setHandlerNote(handlerNote);
            // If CSKH resolves, set handlerId
            if (currentUser.getRole() != null && currentUser.getRole().getName().equals("CUSTOMER_SUPPORT")) {
                ticket.setHandlerId(currentUser.getId());
            }
        }
        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setUpdatedAt(LocalDateTime.now());
        SupportTicket saved = supportTicketRepository.save(ticket);
        return toResponseWithHandler(saved);
    }
}
