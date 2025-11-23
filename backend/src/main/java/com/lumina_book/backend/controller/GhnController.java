package com.lumina_book.backend.controller;

import java.util.List;

import com.lumina_book.backend.dto.response.GhnFeeResponse;
import org.springframework.web.bind.annotation.*;

import com.lumina_book.backend.dto.request.ApiResponse;
import com.lumina_book.backend.dto.request.GhnCalculateFeeRequest;
import com.lumina_book.backend.dto.response.GhnDistrictResponse;
import com.lumina_book.backend.dto.response.GhnProvinceResponse;
import com.lumina_book.backend.dto.response.GhnWardResponse;
import com.lumina_book.backend.service.GhnService;
import com.lumina_book.backend.util.ParseUtil;

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
        Integer provinceId = ParseUtil.parseInteger(provinceIdStr, "province_id");
        log.info("Getting GHN districts for province: {}", provinceId);
        return ApiResponse.<List<GhnDistrictResponse>>builder()
                .result(ghnService.getDistricts(provinceId))
                .build();
    }

    @GetMapping("/wards")
    public ApiResponse<List<GhnWardResponse>> getWards(
            @RequestParam("district_id") String districtIdStr) {
        Integer districtId = ParseUtil.parseInteger(districtIdStr, "district_id");
        log.info("Getting GHN wards for district: {}", districtId);
        return ApiResponse.<List<GhnWardResponse>>builder()
                .result(ghnService.getWards(districtId))
                .build();
    }

    @PostMapping("/shipping-fees")
    public ApiResponse<GhnFeeResponse> calculateShippingFee(
            @RequestBody GhnCalculateFeeRequest request) {
        log.info("Calculating GHN shipping fee");
        return ApiResponse.<GhnFeeResponse>builder()
                .result(ghnService.calculateShippingFee(request))
                .build();
    }
}

