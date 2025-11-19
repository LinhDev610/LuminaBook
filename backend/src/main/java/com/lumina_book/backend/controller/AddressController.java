package com.lumina_book.backend.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

import com.lumina_book.backend.dto.request.AddressCreationRequest;
import com.lumina_book.backend.dto.request.AddressUpdateRequest;
import com.lumina_book.backend.dto.request.ApiResponse;
import com.lumina_book.backend.dto.response.AddressResponse;
import com.lumina_book.backend.service.AddressService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/addresses")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
class AddressController {
    AddressService addressService;

    @PostMapping
    ApiResponse<AddressResponse> createAddress(@RequestBody @Valid AddressCreationRequest request) {
        // log.info("Controller: create Address");
        return ApiResponse.<AddressResponse>builder()
                .result(addressService.createAddress(request))
                .build();
    }

    @GetMapping
    ApiResponse<List<AddressResponse>> getMyAddresses() {
        // log.info("Controller: get my addresses");
        return ApiResponse.<List<AddressResponse>>builder()
                .result(addressService.getMyAddresses())
                .build();
    }

    @GetMapping("/{addressId}")
    ApiResponse<AddressResponse> getAddress(@PathVariable String addressId) {
        // log.info("Controller: get address by ID: {}", addressId);
        return ApiResponse.<AddressResponse>builder()
                .result(addressService.getAddressById(addressId))
                .build();
    }

    @PutMapping("/{addressId}")
    ApiResponse<AddressResponse> updateAddress(
            @PathVariable String addressId,
            @RequestBody @Valid AddressUpdateRequest request) {
        // log.info("Controller: update address with ID: {}", addressId);
        try {
            AddressResponse result = addressService.updateAddress(addressId, request);
            return ApiResponse.<AddressResponse>builder()
                    .result(result)
                    .build();
        } catch (Exception e) {
            log.error("Controller: updateAddress failed - addressId: {}, error: {}", addressId, e.getMessage(), e);
            throw e;
        }
    }

    @DeleteMapping("/{addressId}")
    ApiResponse<String> deleteAddress(@PathVariable String addressId) {
        // log.info("Controller: delete address with ID: {}", addressId);
        addressService.deleteAddress(addressId);
        return ApiResponse.<String>builder()
                .result("Address has been deleted")
                .build();
    }
}

