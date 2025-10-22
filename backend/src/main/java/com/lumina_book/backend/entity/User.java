package com.lumina_book.backend.entity;

import java.time.LocalDate;
import java.util.Set;

import jakarta.persistence.*;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID) // Tạo chuỗi ID ngẫu nhiên
    String id;

    @Column(name = "username", unique = true, columnDefinition = "VARCHAR(255) COLLATE utf8mb4_unicode_ci")
    String username;

    String password;
    String fullName;
    String email;
    String phoneNumber;
    String address;
    String avatarUrl;
    boolean isActive;
    LocalDate createAt;

    // @ManyToMany(fetch = FetchType.EAGER)
    // @JoinTable(
    //     name = "user_roles",
    //     joinColumns = @JoinColumn(name = "user_id"),
    //     inverseJoinColumns = @JoinColumn(name = "role_id")
    // )
    @ManyToMany
    Set<Role> roles;
}
