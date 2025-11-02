package com.lumina_book.backend.mapper;

import java.util.Set;
import java.util.stream.Collectors;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;

import com.lumina_book.backend.dto.request.PromotionCreationRequest;
import com.lumina_book.backend.dto.request.PromotionUpdateRequest;
import com.lumina_book.backend.dto.response.PromotionResponse;
import com.lumina_book.backend.entity.Category;
import com.lumina_book.backend.entity.Product;
import com.lumina_book.backend.entity.Promotion;

@Mapper(componentModel = "spring")
public interface PromotionMapper {

    // Entity to Response
    @Mapping(target = "submittedBy", source = "submittedBy.id")
    @Mapping(target = "approvedBy", source = "approvedBy.id")
    @Mapping(target = "categoryIds", source = "categoryApply", qualifiedByName = "mapCategoryListToIds")
    @Mapping(target = "productIds", source = "productApply", qualifiedByName = "mapProductListToIds")
    PromotionResponse toResponse(Promotion promotion);

    // Request to Entity
    Promotion toPromotion(PromotionCreationRequest request);

    // Update Entity
    @Mapping(target = "id", ignore = true)
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
    void updatePromotion(@MappingTarget Promotion promotion, PromotionUpdateRequest request);

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
