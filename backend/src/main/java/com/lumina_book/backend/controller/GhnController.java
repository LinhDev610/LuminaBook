package com.lumina_book.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.lumina_book.backend.dto.request.ApiResponse;
import com.lumina_book.backend.dto.request.GhnShippingFeeRequest;
import com.lumina_book.backend.dto.response.GhnDistrictResponse;
import com.lumina_book.backend.dto.response.GhnProvinceResponse;
import com.lumina_book.backend.dto.response.GhnWardResponse;
import com.lumina_book.backend.service.GhnService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/ghn")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class GhnController {
    GhnService ghnService;

    @GetMapping("/provinces")
    public ApiResponse<List<GhnProvinceResponse>> getProvinces() {
        log.info("Getting GHN provinces");
        return ApiResponse.<List<GhnProvinceResponse>>builder()
                .result(ghnService.getProvinces())
                .build();
    }

    @GetMapping("/districts")
    public ApiResponse<List<GhnDistrictResponse>> getDistricts(
            @RequestParam("province_id") String provinceIdStr) {
        try {
            Integer provinceId = Integer.parseInt(provinceIdStr);
            log.info("Getting GHN districts for province: {}", provinceId);
            return ApiResponse.<List<GhnDistrictResponse>>builder()
                    .result(ghnService.getDistricts(provinceId))
                    .build();
        } catch (NumberFormatException e) {
            log.error("Invalid province_id format: {}", provinceIdStr);
            throw new com.lumina_book.backend.exception.AppException(
                    com.lumina_book.backend.exception.ErrorCode.INVALID_KEY);
        }
    }

    @GetMapping("/wards")
    public ApiResponse<List<GhnWardResponse>> getWards(
            @RequestParam("district_id") String districtIdStr) {
        try {
            Integer districtId = Integer.parseInt(districtIdStr);
            log.info("Getting GHN wards for district: {}", districtId);
            return ApiResponse.<List<GhnWardResponse>>builder()
                    .result(ghnService.getWards(districtId))
                    .build();
        } catch (NumberFormatException e) {
            log.error("Invalid district_id format: {}", districtIdStr);
            throw new com.lumina_book.backend.exception.AppException(
                    com.lumina_book.backend.exception.ErrorCode.INVALID_KEY);
        }
    }

    @PostMapping("/shipping-fees")
    public ApiResponse<Object> calculateShippingFee(@RequestBody GhnShippingFeeRequest request) {
        log.info("Calculating GHN shipping fee");
        return ApiResponse.<Object>builder()
                .result(ghnService.calculateShippingFee(request))
                .build();
    }
}

