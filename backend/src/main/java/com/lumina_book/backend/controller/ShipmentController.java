package com.lumina_book.backend.controller;

import java.util.List;

import com.lumina_book.backend.entity.Shipment;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.lumina_book.backend.dto.request.ApiResponse;
import com.lumina_book.backend.dto.request.CreateShipmentRequest;
import com.lumina_book.backend.dto.response.GhnFeeResponse;
import com.lumina_book.backend.dto.response.GhnLeadtimeResponse;
import com.lumina_book.backend.dto.response.GhnPickShiftResponse;
import com.lumina_book.backend.dto.response.GhnShipmentDataResponse;
import com.lumina_book.backend.dto.response.ShipmentResponse;
import com.lumina_book.backend.mapper.ShipmentMapper;
import com.lumina_book.backend.service.ShipmentService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/shipments")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ShipmentController {
    ShipmentService shipmentService;
    ShipmentMapper shipmentMapper;

    // Lấy danh sách ca lấy hàng (pick shifts).
    @GetMapping("/pick-shifts")
    public ApiResponse<List<GhnPickShiftResponse>> getPickShifts() {
        return ApiResponse.<List<GhnPickShiftResponse>>builder()
                .result(shipmentService.getPickShifts())
                .build();
    }

    // Tính phí vận chuyển cho đơn hàng.
    @GetMapping("/calculate-fee/{orderId}")
    public ApiResponse<GhnFeeResponse> calculateShippingFee(@PathVariable String orderId) {
        return ApiResponse.<GhnFeeResponse>builder()
                .result(shipmentService.calculateShippingFee(orderId))
                .build();
    }

    // Tính thời gian giao hàng dự kiến.
    @GetMapping("/leadtime/{orderId}")
    public ApiResponse<GhnLeadtimeResponse> getLeadtime(@PathVariable String orderId) {
        return ApiResponse.<GhnLeadtimeResponse>builder()
                .result(shipmentService.getLeadtime(orderId))
                .build();
    }

    // Xem thông tin trả về của đơn hàng trước khi tạo (preview).
    @PostMapping("/preview/{orderId}")
    public ApiResponse<GhnShipmentDataResponse> previewOrder(
            @PathVariable String orderId,
            @RequestBody(required = false) CreateShipmentRequest request) {
        List<Integer> pickShiftIds = request != null ? request.getPickShiftIds() : null;
        return ApiResponse.<GhnShipmentDataResponse>builder()
                .result(shipmentService.previewOrder(orderId, pickShiftIds))
                .build();
    }

    // Tạo đơn hàng GHN từ Order.
    @PostMapping("/create/{orderId}")
    public ApiResponse<ShipmentResponse> createGhnShipment(
            @PathVariable String orderId,
            @RequestBody(required = false) CreateShipmentRequest request) {
        List<Integer> pickShiftIds = request != null ? request.getPickShiftIds() : null;
        Shipment shipment = shipmentService.createGhnOrder(orderId, pickShiftIds);
        return ApiResponse.<ShipmentResponse>builder()
                .result(shipmentMapper.toResponse(shipment))
                .build();
    }

    // Lấy thông tin shipment theo order ID.
    @GetMapping("/order/{orderId}")
    public ApiResponse<ShipmentResponse> getShipmentByOrderId(@PathVariable String orderId) {
        Shipment shipment = shipmentService.getShipmentByOrderId(orderId);
        return ApiResponse.<ShipmentResponse>builder()
                .result(shipmentMapper.toResponse(shipment))
                .build();
    }

    // Lấy thông tin shipment theo GHN order code.
    @GetMapping("/ghn-code/{orderCode}")
    public ApiResponse<ShipmentResponse> getShipmentByOrderCode(@PathVariable String orderCode) {
        Shipment shipment = shipmentService.getShipmentByOrderCode(orderCode);
        return ApiResponse.<ShipmentResponse>builder()
                .result(shipmentMapper.toResponse(shipment))
                .build();
    }
}
