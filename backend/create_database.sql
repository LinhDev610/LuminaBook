-- Tạo database identity_service
CREATE DATABASE IF NOT EXISTS identity_service;

-- Sử dụng database
USE identity_service;

-- Tạo bảng users (đã được đổi tên từ user)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    dob DATE
);

-- Tạo bảng otp
CREATE TABLE IF NOT EXISTS otp (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    created_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE
);

-- Tạo bảng roles
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT
);

-- Tạo bảng permissions
CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT
);

-- Tạo bảng user_roles (many-to-many)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR(36),
    role_id VARCHAR(36),
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Tạo bảng role_permissions (many-to-many)
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(36),
    permission_id VARCHAR(36),
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
);

-- Tạo bảng invalidated_tokens
CREATE TABLE IF NOT EXISTS invalidated_tokens (
    id VARCHAR(36) PRIMARY KEY,
    token VARCHAR(255) NOT NULL,
    expiry_time DATETIME NOT NULL
);

