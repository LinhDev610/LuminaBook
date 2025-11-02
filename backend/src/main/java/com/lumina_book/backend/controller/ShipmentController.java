package com.lumina_book.backend.controller;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import com.lumina_book.backend.dto.request.ApiResponse;
import com.lumina_book.backend.dto.request.CreateGhnShipmentRequest;
import com.lumina_book.backend.entity.Shipment;
import com.lumina_book.backend.service.ShipmentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/shipments")
@RequiredArgsConstructor
public class ShipmentController {
    private final ShipmentService shipmentService;

    @PostMapping("/ghn")
    public ApiResponse<Shipment> createGhnShipment(@RequestBody @Validated CreateGhnShipmentRequest request) {
        Shipment shipment = shipmentService.createGhnOrder(request);
        return ApiResponse.<Shipment>builder().result(shipment).build();
    }
}
