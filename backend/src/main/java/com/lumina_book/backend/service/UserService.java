package com.lumina_book.backend.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.lumina_book.backend.dto.request.UserCreationRequest;
import com.lumina_book.backend.dto.request.UserUpdateRequest;
import com.lumina_book.backend.dto.response.UserResponse;
import com.lumina_book.backend.entity.Role;
import com.lumina_book.backend.entity.User;
import com.lumina_book.backend.exception.AppException;
import com.lumina_book.backend.exception.ErrorCode;
import com.lumina_book.backend.mapper.UserMapper;
import com.lumina_book.backend.repository.RoleRepository;
import com.lumina_book.backend.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
// Tạo 1 constructor cho tất cả các biến define là final -> Tự động đưa vào
// constructor và inject dependency
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserService {
    UserRepository userRepository;
    RoleRepository roleRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;

    @NonFinal
    @Value("${app.default-avatar}")
    private String defaultAvatarUrl;

    public UserResponse createUser(UserCreationRequest request) {
        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber() : "");
        user.setFullName(request.getFullName());
        user.setAddress(request.getAddress() != null ? request.getAddress() : "");
        user.setAvatarUrl(defaultAvatarUrl);
        user.setCreateAt(LocalDate.now());

        Role role = roleRepository
                .findById(request.getRoleName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        user.setActive(role.getName().equals("CUSTOMER"));
        user.setRole(role);

        try {
            user = userRepository.save(user);
        } catch (DataIntegrityViolationException exception) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        return userMapper.toUserResponse(user);
    }

    public UserResponse getMyInfo() {
        // SecurityContextHolder chứa thông tin về user đang đăng nhập
        // Khi request được xác định thành công -> thông tin lưu trữ của user được lưu trong Security context holder
        var context = SecurityContextHolder.getContext();
        String name = context.getAuthentication().getName();

        User user = userRepository.findByEmail(name).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        return userMapper.toUserResponse(user);
    }

    // User chỉ có thể lấy được thông tin của chính mình, không thể lấy được thông tin của người khác
    @PostAuthorize("returnObject.email == authentication.name")
    public UserResponse updateUser(String userId, UserUpdateRequest request) {
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        userMapper.updateUser(user, request);

        // Check current user is ADMIN
        var context = SecurityContextHolder.getContext();
        String currentEmail = context.getAuthentication().getName();
        User currentUser = userRepository
                .findByEmail(currentEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        boolean isAdmin =
                currentUser.getRole() != null && currentUser.getRole().getName().equals("ADMIN");

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            String roleName = currentUser.getRole().getName();
            if (roleName.equals("STAFF") || roleName.equals("CUSTOMER_SUPPORT")) {
                user.setActive(true);
            }
        }

        // Change Email
        if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            if (isAdmin) {
                user.setEmail(request.getEmail());
            }
        }

        // PhoneNumber
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isEmpty()) {
            user.setPhoneNumber(request.getPhoneNumber());
        }

        // FullName
        if (request.getFullName() != null && !request.getFullName().isEmpty()) {
            user.setFullName(request.getFullName());
        }
        // Address
        if (request.getAddress() != null && !request.getAddress().isEmpty()) {
            user.setAddress(request.getAddress());
        }
        // AvatarUrl
        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isEmpty()) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        // role
        if (request.getRole() != null && !request.getRole().isEmpty()) {
            if (isAdmin) {
                Role newRole = roleRepository
                        .findById(request.getRole())
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
                user.setRole(newRole);
            } else {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
        }

        // isActive
        if (isAdmin) {
            user.setActive(request.getIsActive());
        } else {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return userMapper.toUserResponse(userRepository.save(user));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(String userId) {
        userRepository.deleteById(userId);
    }

    // @EnableMethodSecurity trong SecurityConfig
    @PreAuthorize("hasRole('ADMIN')") // Spring tạo ra 1 proxy ngay trước khi tạo hàm. Sử dụng được nhờ khai báo
    public List<UserResponse> getUsers() {
        log.info("In method get Users");
        return userRepository.findAll().stream().map(userMapper::toUserResponse).toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse getUser(String id) {
        return userMapper.toUserResponse(
                userRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED)));
    }
}
