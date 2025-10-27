package com.lumina_book.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lumina_book.backend.entity.ProductMedia;
import com.lumina_book.backend.repository.ProductMediaRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductMediaService {

    private final ProductMediaRepository productMediaRepository;

    @Transactional
    public void setDefaultMedia(String productId, String mediaId) {
        // Bỏ isDefault của tất cả media của product này
        productMediaRepository.clearDefaultForProduct(productId);

        // Đặt media này làm mặc định
        ProductMedia media =
                productMediaRepository.findById(mediaId).orElseThrow(() -> new RuntimeException("Media not found"));

        media.setDefault(true);
        productMediaRepository.save(media);
    }

    public ProductMedia getDefaultMedia(String productId) {
        return productMediaRepository.findByProductIdAndIsDefaultTrue(productId).orElse(null);
    }

    public List<ProductMedia> getProductMedia(String productId) {
        return productMediaRepository.findByProductIdOrderByDisplayOrderAsc(productId);
    }
}
