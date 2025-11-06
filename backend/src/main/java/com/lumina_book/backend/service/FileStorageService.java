package com.lumina_book.backend.service;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class FileStorageService {

    private static final String PRODUCT_MEDIA_DIR = "product_media"; // relative to project root (working dir)

    /**
     * Lưu file vào thư mục product_media/
     * @param file File cần lưu
     * @return URL của file đã lưu
     */
    public String storeFile(MultipartFile file) {
        return storeFile(file, PRODUCT_MEDIA_DIR, "/product_media/");
    }

    /**
     * Lưu file media của product vào thư mục product_media/
     * @param file File cần lưu
     * @return URL của file đã lưu
     */
    public String storeProductMedia(MultipartFile file) {
        return storeFile(file, PRODUCT_MEDIA_DIR, "/product_media/");
    }

    /**
     * Lưu file vào thư mục chỉ định
     * @param file File cần lưu
     * @param directory Thư mục đích
     * @param urlPath Đường dẫn URL để truy cập file
     * @return URL của file đã lưu
     */
    private String storeFile(MultipartFile file, String directory, String urlPath) {
        try {
            String original = file.getOriginalFilename();
            String ext = "";
            if (original != null && original.contains(".")) {
                ext = original.substring(original.lastIndexOf('.'));
            }
            String filename = UUID.randomUUID() + ext;
            Path uploadPath = Paths.get(directory);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            Path target = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            String url = ServletUriComponentsBuilder
                    .fromCurrentContextPath()
                    .path(urlPath)
                    .path(filename)
                    .build()
                    .toUriString();
            return url;
        } catch (IOException e) {
            log.error("Failed to store file", e);
            throw new RuntimeException("Failed to store file", e);
        }
    }
}


