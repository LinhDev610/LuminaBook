package com.lumina_book.backend.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lumina_book.backend.constant.GhnConstants;
import com.lumina_book.backend.dto.request.GhnCalculateFeeRequest;
import com.lumina_book.backend.dto.request.GhnCreateOrderRequest;
import com.lumina_book.backend.dto.request.GhnLeadtimeRequest;
import com.lumina_book.backend.dto.request.GhnOrderItemCategoryRequest;
import com.lumina_book.backend.dto.request.GhnOrderItemRequest;
import com.lumina_book.backend.dto.response.GhnDistrictResponse;
import com.lumina_book.backend.dto.response.GhnFeeResponse;
import com.lumina_book.backend.dto.response.GhnLeadtimeResponse;
import com.lumina_book.backend.dto.response.GhnPickShiftResponse;
import com.lumina_book.backend.dto.response.GhnProvinceResponse;
import com.lumina_book.backend.dto.response.GhnShipmentDataResponse;
import com.lumina_book.backend.dto.response.GhnWardResponse;
import com.lumina_book.backend.dto.response.ShipmentResponse;
import com.lumina_book.backend.entity.Address;
import com.lumina_book.backend.entity.Order;
import com.lumina_book.backend.entity.OrderItem;
import com.lumina_book.backend.entity.Product;
import com.lumina_book.backend.entity.Shipment;
import com.lumina_book.backend.enums.ShipmentProvider;
import com.lumina_book.backend.enums.ShipmentStatus;
import com.lumina_book.backend.exception.AppException;
import com.lumina_book.backend.exception.ErrorCode;
import com.lumina_book.backend.repository.OrderRepository;
import com.lumina_book.backend.repository.ShipmentRepository;
import com.lumina_book.backend.mapper.ShipmentMapper;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ShipmentService {
    ShipmentRepository shipmentRepository;
    OrderRepository orderRepository;
    GhnService ghnService;
    ShipmentMapper shipmentMapper;

    public List<GhnProvinceResponse> getProvinces() {
        return ghnService.getProvinces();
    }

    public List<GhnDistrictResponse> getDistricts(Integer provinceId) {
        return ghnService.getDistricts(provinceId);
    }

    public List<GhnWardResponse> getWards(Integer districtId) {
        return ghnService.getWards(districtId);
    }

    public List<GhnPickShiftResponse> getPickShifts() {
        return ghnService.getPickShifts();
    }

    public GhnFeeResponse calculateShippingFee(GhnCalculateFeeRequest request) {
        return ghnService.calculateShippingFee(request);
    }

    public GhnFeeResponse calculateShippingFee(String orderId) {
        Order order = validateOrderWithAddress(orderId);
        GhnCreateOrderRequest ghnRequest = buildGhnCreateOrderRequest(order, null);
        
        GhnCalculateFeeRequest feeRequest = GhnCalculateFeeRequest.builder()
                .serviceTypeId(ghnRequest.getServiceTypeId())
                .insuranceValue(ghnRequest.getInsuranceValue())
                .fromDistrictId(ghnRequest.getFromDistrictId())
                .fromWardCode(ghnRequest.getFromWardCode())
                .toDistrictId(ghnRequest.getToDistrictId())
                .toWardCode(ghnRequest.getToWardCode())
                .length(ghnRequest.getLength())
                .width(ghnRequest.getWidth())
                .height(ghnRequest.getHeight())
                .weight(ghnRequest.getWeight())
                .items(ghnRequest.getItems())
                .build();

        return ghnService.calculateShippingFee(feeRequest);
    }

    public GhnLeadtimeResponse getLeadtime(GhnLeadtimeRequest request) {
        return ghnService.getLeadtime(
                request.getFromDistrictId(),
                request.getFromWardCode(),
                request.getToDistrictId(),
                request.getToWardCode(),
                request.getServiceTypeId());
    }

    public GhnLeadtimeResponse getLeadtime(String orderId) {
        Order order = validateOrderWithAddress(orderId);
        GhnCreateOrderRequest ghnRequest = buildGhnCreateOrderRequest(order, null);
        
        // Build request từ order và gọi hàm chung
        GhnLeadtimeRequest leadtimeRequest = GhnLeadtimeRequest.builder()
                .fromDistrictId(ghnRequest.getFromDistrictId())
                .fromWardCode(ghnRequest.getFromWardCode())
                .toDistrictId(ghnRequest.getToDistrictId())
                .toWardCode(ghnRequest.getToWardCode())
                .serviceTypeId(ghnRequest.getServiceTypeId())
                .build();
        
        return getLeadtime(leadtimeRequest);
    }

    public GhnShipmentDataResponse previewOrder(String orderId, List<Integer> pickShiftIds) {
        Order order = validateOrderWithAddress(orderId);
        GhnCreateOrderRequest ghnRequest = buildGhnCreateOrderRequest(order, pickShiftIds);
        return ghnService.previewOrder(ghnRequest);
    }

    @Transactional
    public ShipmentResponse createGhnOrder(String orderId, List<Integer> pickShiftIds) {
        Order order = validateOrderWithAddress(orderId);
        shipmentRepository.findByOrderId(orderId)
                .ifPresent(existing -> {
                    throw new AppException(ErrorCode.BAD_REQUEST, "Đơn hàng đã có vận đơn GHN");
                });

        List<Integer> effectivePickShifts = resolvePickShiftIds(pickShiftIds);
        GhnCreateOrderRequest ghnRequest = buildGhnCreateOrderRequest(order, effectivePickShifts);
        GhnShipmentDataResponse ghnData = ghnService.createOrder(ghnRequest);
        
        if (ghnData == null) {
            throw new AppException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }

        Shipment saved = shipmentRepository.save(buildShipmentFromGhnData(order, ghnData));
        return shipmentMapper.toResponse(saved);
    }

    public ShipmentResponse getShipmentByOrderId(String orderId) {
        Shipment shipment = shipmentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.SHIPMENT_NOT_EXISTED));
        return shipmentMapper.toResponse(shipment);
    }

    public ShipmentResponse getShipmentByOrderCode(String orderCode) {
        Shipment shipment = shipmentRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new AppException(ErrorCode.SHIPMENT_NOT_EXISTED));
        return shipmentMapper.toResponse(shipment);
    }

    // Build GHN CreateOrderRequest từ Order.
    private GhnCreateOrderRequest buildGhnCreateOrderRequest(Order order, List<Integer> pickShiftIds) {
        Address address = order.getAddress();
        int totalWeight = calculateTotalWeight(order);
        int serviceTypeId = determineServiceType(totalWeight);
        Long codAmount = calculateCodAmount(order);

        var builder = GhnCreateOrderRequest.builder()
                .paymentTypeId(GhnConstants.PAYMENT_TYPE_RECEIVER)
                .requiredNote(GhnConstants.REQUIRED_NOTE)
                .returnPhone(GhnConstants.DEFAULT_FROM_PHONE)
                .clientOrderCode(order.getCode())
                .fromName(GhnConstants.DEFAULT_FROM_NAME)
                .fromPhone(GhnConstants.DEFAULT_FROM_PHONE)
                .fromAddress(GhnConstants.DEFAULT_FROM_ADDRESS)
                .fromWardCode(GhnConstants.DEFAULT_FROM_WARD_CODE)
                .fromDistrictId(GhnConstants.DEFAULT_FROM_DISTRICT_ID)
                .fromProvinceId(GhnConstants.DEFAULT_FROM_PROVINCE_ID)
                .toName(address.getRecipientName())
                .toPhone(address.getRecipientPhoneNumber())
                .toAddress(buildFullAddress(address))
                .toWardCode(address.getWardCode())
                .toDistrictId(parseInteger(address.getDistrictID()))
                .toProvinceId(parseInteger(address.getProvinceID()))
                .codAmount(codAmount)
                .content(GhnConstants.CONTENT)
                .codFailedAmount(GhnConstants.COD_FAILED_AMOUNT)
                .pickStationId(null)
                .deliverStationId(null)
                .insuranceValue(codAmount)
                .serviceTypeId(serviceTypeId)
                .coupon(null)
                .pickupTime(Instant.now().getEpochSecond())
                .pickShift(pickShiftIds != null ? pickShiftIds : new ArrayList<>())
                .note(order.getNote());

        if (serviceTypeId == GhnConstants.SERVICE_TYPE_LIGHT) {
            var lightDims = calculateLightServiceDimensions(order);
            builder.length(lightDims.length)
                    .width(lightDims.width)
                    .height(lightDims.height)
                    .weight(lightDims.weight);
        } else {
            var heavyItems = buildHeavyServiceItems(order);
            builder.length(null)
                    .width(null)
                    .height(null)
                    .weight(null)
                    .items(heavyItems);
        }

        return builder.build();
    }

    // GHN tự động chọn ca lấy hàng dựa trên thời gian hiện tại
    private List<Integer> resolvePickShiftIds(List<Integer> pickShiftIds) {
        if (pickShiftIds != null && !pickShiftIds.isEmpty()) {
            return pickShiftIds;
        }

        try {
            List<GhnPickShiftResponse> shifts = ghnService.getPickShifts();
            if (shifts == null || shifts.isEmpty()) {
                return new ArrayList<>();
            }

            long now = Instant.now().getEpochSecond();
            Integer shiftId = shifts.stream()
                    .filter(shift -> shift.getFromTime() != null && shift.getFromTime() >= now)
                    .map(GhnPickShiftResponse::getId)
                    .filter(Objects::nonNull)
                    .findFirst()
                    .orElseGet(() -> shifts.get(0).getId());

            return shiftId != null ? new ArrayList<>(List.of(shiftId)) : new ArrayList<>();
        } catch (Exception e) {
            log.warn("Không thể lấy danh sách ca lấy hàng từ GHN, fallback tới danh sách ca lấy hàng mặc định");
            return new ArrayList<>();
        }
    }

    private int calculateTotalWeight(Order order) {
        if (order.getItems() == null || order.getItems().isEmpty()) {
            return 0;
        }

        return order.getItems().stream()
                .mapToInt(item -> {
                    Product product = item.getProduct();
                    if (product == null || product.getWeight() == null) {
                        return 0;
                    }
                    int weightInGrams = (int) (product.getWeight() * 1000);
                    return weightInGrams * (item.getQuantity() != null ? item.getQuantity() : 1);
                })
                .sum();
    }

    private int determineServiceType(int totalWeightGrams) {
        return totalWeightGrams >= GhnConstants.HEAVY_SERVICE_WEIGHT_THRESHOLD 
                ? GhnConstants.SERVICE_TYPE_HEAVY 
                : GhnConstants.SERVICE_TYPE_LIGHT;
    }

    private Long calculateCodAmount(Order order) {
        if (order.getTotalAmount() == null || order.getShippingFee() == null) {
            return 0L;
        }
        return Math.round(order.getTotalAmount() - order.getShippingFee());
    }

    private ParcelDimensions calculateLightServiceDimensions(Order order) {
        if (order.getItems() == null || order.getItems().isEmpty()) {
            return new ParcelDimensions(
                GhnConstants.DEFAULT_DIMENSION,
                GhnConstants.DEFAULT_DIMENSION,
                GhnConstants.DEFAULT_DIMENSION,
                GhnConstants.DEFAULT_WEIGHT
            );
        }

        int maxLength = GhnConstants.DEFAULT_DIMENSION;
        int maxWidth = GhnConstants.DEFAULT_DIMENSION;
        int sumHeight = 0;
        int totalWeight = 0;

        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            if (product == null) continue;

            int quantity = item.getQuantity() != null ? item.getQuantity() : 1;
            var dims = getProductDimensions(product);
            
            maxLength = Math.max(maxLength, dims.length);
            maxWidth = Math.max(maxWidth, dims.width);
            sumHeight += dims.height * quantity;
            totalWeight += dims.weight * quantity;
        }

        return new ParcelDimensions(
            maxLength,
            maxWidth,
            Math.max(sumHeight, GhnConstants.DEFAULT_DIMENSION),
            Math.max(totalWeight, GhnConstants.DEFAULT_WEIGHT)
        );
    }

    private List<GhnOrderItemRequest> buildHeavyServiceItems(Order order) {
        if (order.getItems() == null || order.getItems().isEmpty()) {
            return new ArrayList<>();
        }

        return order.getItems().stream()
                .map(item -> {
                    var product = item.getProduct();
                    if (product == null) {
                        throw new IllegalArgumentException("OrderItem must have a product");
                    }

                    var dims = getProductDimensions(product);
                    var category = GhnOrderItemCategoryRequest.builder()
                            .level1(product.getCategory() != null ? product.getCategory().getName() : "Sách")
                            .build();

                    return GhnOrderItemRequest.builder()
                            .name(product.getName())
                            .code(product.getId())
                            .quantity(item.getQuantity() != null ? item.getQuantity() : 1)
                            .price(item.getFinalPrice() != null ? item.getFinalPrice().intValue() : 0)
                            .length(dims.length)
                            .width(dims.width)
                            .height(dims.height)
                            .weight(dims.weight)
                            .category(category)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private ProductDimensions getProductDimensions(Product product) {
        if (product == null) {
            return new ProductDimensions(
                GhnConstants.DEFAULT_DIMENSION,
                GhnConstants.DEFAULT_DIMENSION,
                GhnConstants.DEFAULT_DIMENSION,
                GhnConstants.DEFAULT_WEIGHT
            );
        }

        int length = product.getLength() != null ? product.getLength().intValue() : GhnConstants.DEFAULT_DIMENSION;
        int width = product.getWidth() != null ? product.getWidth().intValue() : GhnConstants.DEFAULT_DIMENSION;
        int height = product.getHeight() != null ? product.getHeight().intValue() : GhnConstants.DEFAULT_DIMENSION;
        int weight = product.getWeight() != null ? (int) (product.getWeight() * 1000) : GhnConstants.DEFAULT_WEIGHT;

        return new ProductDimensions(
            Math.max(length, GhnConstants.DEFAULT_DIMENSION),
            Math.max(width, GhnConstants.DEFAULT_DIMENSION),
            Math.max(height, GhnConstants.DEFAULT_DIMENSION),
            Math.max(weight, GhnConstants.DEFAULT_WEIGHT)
        );
    }

    private String buildFullAddress(Address address) {
        StringBuilder sb = new StringBuilder();
        appendIfNotBlank(sb, address.getAddress());
        appendIfNotBlank(sb, address.getWardName());
        appendIfNotBlank(sb, address.getDistrictName());
        appendIfNotBlank(sb, address.getProvinceName());
        appendIfNotBlank(sb, address.getCountry());
        return sb.toString();
    }

    private void appendIfNotBlank(StringBuilder sb, String value) {
        if (value != null && !value.isBlank()) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(value);
        }
    }

    private Integer parseInteger(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Order validateOrderWithAddress(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));
        
        if (order.getAddress() == null) {
            throw new AppException(ErrorCode.ADDRESS_NOT_EXISTED);
        }
        
        return order;
    }

    private Shipment buildShipmentFromGhnData(Order order, GhnShipmentDataResponse ghnData) {
        return Shipment.builder()
                .order(order)
                .provider(ShipmentProvider.GHN)
                .status(ShipmentStatus.CREATED)
                .orderCode(ghnData.getOrder_code())
                .totalFee(ghnData.getTotal_fee())
                .build();
    }


    // Helper classes
    // Entity kích thước bưu kiện
    private static class ParcelDimensions {
        final int length, width, height, weight;
        ParcelDimensions(int length, int width, int height, int weight) {
            this.length = length;
            this.width = width;
            this.height = height;
            this.weight = weight;
        }
    }

    // Entity kích thước sản phẩm
    private static class ProductDimensions {
        final int length, width, height, weight;
        ProductDimensions(int length, int width, int height, int weight) {
            this.length = length;
            this.width = width;
            this.height = height;
            this.weight = weight;
        }
    }
}
