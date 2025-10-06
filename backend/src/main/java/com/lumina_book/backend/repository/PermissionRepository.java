package com.lumina_book.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lumina_book.backend.entity.Permission;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, String> {}
