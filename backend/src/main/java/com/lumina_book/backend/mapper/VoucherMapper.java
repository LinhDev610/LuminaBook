package com.lumina_book.backend.mapper;

import java.util.Set;
import java.util.stream.Collectors;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import org.mapstruct.NullValuePropertyMappingStrategy;

import com.lumina_book.backend.dto.request.VoucherCreationRequest;
import com.lumina_book.backend.dto.request.VoucherUpdateRequest;
import com.lumina_book.backend.dto.response.VoucherResponse;
import com.lumina_book.backend.entity.Category;
import com.lumina_book.backend.entity.Product;
import com.lumina_book.backend.entity.Voucher;

@Mapper(componentModel = "spring")
public interface VoucherMapper {

    @Mapping(target = "submittedBy", source = "submittedBy.id")
    @Mapping(target = "approvedBy", source = "approvedBy.id")
    @Mapping(target = "categoryIds", source = "categoryApply", qualifiedByName = "mapCategoryListToIds")
    @Mapping(target = "productIds", source = "productApply", qualifiedByName = "mapProductListToIds")
    VoucherResponse toResponse(Voucher voucher);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "maxOrderValue", ignore = true)
    @Mapping(target = "usageCount", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "submittedBy", ignore = true)
    @Mapping(target = "approvedBy", ignore = true)
    @Mapping(target = "submittedAt", ignore = true)
    @Mapping(target = "approvedAt", ignore = true)
    @Mapping(target = "rejectionReason", ignore = true)
    @Mapping(target = "categoryApply", ignore = true)
    @Mapping(target = "productApply", ignore = true)
    Voucher toVoucher(VoucherCreationRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "maxOrderValue", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "submittedBy", ignore = true)
    @Mapping(target = "approvedBy", ignore = true)
    @Mapping(target = "submittedAt", ignore = true)
    @Mapping(target = "approvedAt", ignore = true)
    @Mapping(target = "rejectionReason", ignore = true)
    @Mapping(target = "usageCount", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "categoryApply", ignore = true)
    @Mapping(target = "productApply", ignore = true)
    void updateVoucher(@MappingTarget Voucher voucher, VoucherUpdateRequest request);

    @Named("mapCategoryListToIds")
    default Set<String> mapCategoryListToIds(Set<Category> categories) {
        if (categories == null) return null;
        return categories.stream().map(Category::getId).collect(Collectors.toSet());
    }

    @Named("mapProductListToIds")
    default Set<String> mapProductListToIds(Set<Product> products) {
        if (products == null) return null;
        return products.stream().map(Product::getId).collect(Collectors.toSet());
    }
}


