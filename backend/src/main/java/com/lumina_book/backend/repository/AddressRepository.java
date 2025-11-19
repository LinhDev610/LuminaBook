package com.lumina_book.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lumina_book.backend.entity.Address;

@Repository
public interface AddressRepository extends JpaRepository<Address,String> {
    boolean existsByAddressId(String id);
}
