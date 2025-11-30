package com.lumina_book.backend.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

import com.lumina_book.backend.dto.request.ApiResponse;
import com.lumina_book.backend.dto.request.StaffCreationRequest;
import com.lumina_book.backend.dto.request.UserCreationRequest;
import com.lumina_book.backend.dto.request.UserUpdateRequest;
import com.lumina_book.backend.dto.response.UserResponse;
import com.lumina_book.backend.entity.Role;
import com.lumina_book.backend.repository.RoleRepository;
import com.lumina_book.backend.service.UserService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserController {
    UserService userService;
    RoleRepository roleRepository;

    @PostMapping
    ApiResponse<UserResponse> createUser(@RequestBody @Valid UserCreationRequest request) {
        log.info("Controller: create User");
        return ApiResponse.<UserResponse>builder()
                .result(userService.createUser(request))
                .build();
    }

    @PostMapping("/staff")
    ApiResponse<UserResponse> createStaff(@RequestBody @Valid StaffCreationRequest request) {
        log.info("Controller: create Staff");
        return ApiResponse.<UserResponse>builder()
                .result(userService.createStaff(request))
                .build();
    }

    @GetMapping
    ApiResponse<List<UserResponse>> getUsers() {
        return ApiResponse.<List<UserResponse>>builder()
                .result(userService.getUsers())
                .build();
    }

    @GetMapping("/my-info")
    ApiResponse<UserResponse> getMyInfo() {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getMyInfo())
                .build();
    }

    @DeleteMapping("/{userId}")
    ApiResponse<String> deleteUser(@PathVariable String userId) {
        userService.deleteUser(userId);
        return ApiResponse.<String>builder().result("User has been deleted").build();
    }

    @GetMapping("/{userId}")
    ApiResponse<UserResponse> getUser(@PathVariable String userId) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getUser(userId))
                .build();
    }

    @PutMapping("/{userId}")
    ApiResponse<UserResponse> updateUser(@PathVariable String userId, @RequestBody UserUpdateRequest request) {
        try {
            UserResponse result = userService.updateUser(userId, request);
            return ApiResponse.<UserResponse>builder()
                    .result(result)
                    .build();
        } catch (Exception e) {
            log.error("Controller: updateUser failed - userId: {}, error: {}", userId, e.getMessage(), e);
            throw e;
        }
    }

    @GetMapping("/roles")
    ApiResponse<List<Role>> getRoles() {
        log.info("Controller: get all roles");
        return ApiResponse.<List<Role>>builder()
                .result(roleRepository.findAll())
                .build();
    }
}
