package com.lumina_book.backend.mapper;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.lumina_book.backend.dto.request.ProductCreationRequest;
import com.lumina_book.backend.dto.request.ProductUpdateRequest;
import com.lumina_book.backend.dto.response.ProductResponse;
import com.lumina_book.backend.entity.Product;
import com.lumina_book.backend.entity.ProductMedia;
import com.lumina_book.backend.entity.Promotion;
import com.lumina_book.backend.entity.Review;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    // Entity to Response
    @Mapping(target = "submittedBy", source = "submittedBy.id")
    @Mapping(target = "submittedByName", source = "submittedBy.fullName")
    @Mapping(target = "approvedBy", source = "approvedBy.id")
    @Mapping(target = "approvedByName", source = "approvedBy.fullName")
    @Mapping(target = "categoryId", source = "category.id")
    @Mapping(target = "categoryName", source = "category.name")
    @Mapping(target = "promotionId", source = "promotion", qualifiedByName = "mapPromotionId")
    @Mapping(target = "promotionName", source = "promotion", qualifiedByName = "mapPromotionName")
    @Mapping(target = "promotionStartDate", source = "promotion", qualifiedByName = "mapPromotionStartDate")
    @Mapping(target = "promotionExpiryDate", source = "promotion", qualifiedByName = "mapPromotionExpiryDate")
    @Mapping(target = "mediaUrls", source = "mediaList", qualifiedByName = "mapMediaUrls")
    @Mapping(target = "defaultMediaUrl", source = "defaultMedia.mediaUrl", qualifiedByName = "normalizeUrl")
    @Mapping(target = "reviewCount", source = "reviews", qualifiedByName = "mapReviewCount")
    @Mapping(target = "averageRating", source = "reviews", qualifiedByName = "mapAverageRating")
    @Mapping(target = "stockQuantity", source = "inventory.stockQuantity")
    ProductResponse toResponse(Product product);

    // Request to Entity
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "submittedBy", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "promotion", ignore = true)
    @Mapping(target = "mediaList", ignore = true)
    @Mapping(target = "defaultMedia", ignore = true)
    @Mapping(target = "reviews", ignore = true)
    @Mapping(target = "inventory", ignore = true)
    @Mapping(target = "banners", ignore = true)
    @Mapping(target = "quantitySold", ignore = true)
    Product toProduct(ProductCreationRequest request);

    // Update Entity
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "submittedBy", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "promotion", ignore = true)
    @Mapping(target = "mediaList", ignore = true)
    @Mapping(target = "defaultMedia", ignore = true)
    @Mapping(target = "reviews", ignore = true)
    @Mapping(target = "inventory", ignore = true)
    @Mapping(target = "banners", ignore = true)
    @Mapping(target = "quantitySold", ignore = true)
    @Mapping(target = "price", ignore = true)
    @Mapping(target = "unitPrice", ignore = true)
    @Mapping(target = "tax", ignore = true)
    @Mapping(target = "discountValue", ignore = true)
    @Mapping(target = "purchasePrice", ignore = true)
    @Mapping(target = "status", ignore = true)
    void updateProduct(@MappingTarget Product product, ProductUpdateRequest request);

    @Named("mapMediaUrls")
    default List<String> mapMediaUrls(List<ProductMedia> mediaList) {
        if (mediaList == null) return null;
        return mediaList.stream().map(pm -> normalizeUrl(pm.getMediaUrl())).toList();
    }

    @Named("normalizeUrl")
    default String normalizeUrl(String url) {
        if (url == null || url.isBlank()) return url;
        // Nếu URL đã là absolute, thì không cần thiết phải thêm thông tin context path.
        String lower = url.toLowerCase();
        if (lower.startsWith("http://") || lower.startsWith("https://")) {
            return url;
        }
        // Nếu URL bắt đầu với /product_media, thì thêm thông tin context path (ví dụ: /lumina_book)
        if (url.startsWith("/product_media")) {
            String base = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
            return base + url;
        }
        // Nếu URL không phải là absolute và không bắt đầu với /product_media, thì coi như là tên file hoặc relative và mount dưới /product_media/
        String base = ServletUriComponentsBuilder.fromCurrentContextPath().path("/product_media/").build().toUriString();
        if (base.endsWith("/")) return base + url;
        return base + "/" + url;
    }

    @Named("mapReviewCount")
    default Integer mapReviewCount(List<Review> reviews) {
        return reviews != null ? reviews.size() : 0;
    }

    @Named("mapAverageRating")
    default Double mapAverageRating(List<Review> reviews) {
        if (reviews == null || reviews.isEmpty()) return 0.0;
        return reviews.stream().mapToDouble(Review::getRating).average().orElse(0.0);
    }

    @Named("mapPromotionId")
    default String mapPromotionId(Promotion promotion) {
        return promotion != null ? promotion.getId() : null;
    }

    @Named("mapPromotionName")
    default String mapPromotionName(Promotion promotion) {
        return promotion != null ? promotion.getName() : null;
    }

    @Named("mapPromotionStartDate")
    default java.time.LocalDate mapPromotionStartDate(Promotion promotion) {
        return promotion != null ? promotion.getStartDate() : null;
    }

    @Named("mapPromotionExpiryDate")
    default java.time.LocalDate mapPromotionExpiryDate(Promotion promotion) {
        return promotion != null ? promotion.getExpiryDate() : null;
    }
}
