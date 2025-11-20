package com.lumina_book.backend.service;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.lumina_book.backend.exception.AppException;
import com.lumina_book.backend.exception.ErrorCode;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class FileStorageService {

    private static final String PRODUCT_MEDIA_DIR = "uploads/product_media";
    private static final String VOUCHER_MEDIA_DIR = "uploads/vouchers";
    private static final String PROMOTION_MEDIA_DIR = "uploads/promotions";
    private static final String PROFILE_MEDIA_DIR = "uploads/profile_media";
    private static final String VOUCHER_MEDIA_URL = "/voucher_media/";
    private static final String PROMOTION_MEDIA_URL = "/promotion_media/";
    private static final String PROFILE_MEDIA_URL = "/profile_media/";

    /**
     * Lưu file media của product vào thư mục product_media/
     * @param file File cần lưu
     * @return URL của file đã lưu
     */
    public String storeProductMedia(MultipartFile file) {
        return storeFile(file, PRODUCT_MEDIA_DIR, "/product_media/");
    }

    /**
     * Lưu file media của voucher vào thư mục vouchers/
     * @param file File cần lưu
     * @return URL của file đã lưu
     */
    public String storeVoucherMedia(MultipartFile file) {
        return storeFile(file, VOUCHER_MEDIA_DIR, VOUCHER_MEDIA_URL);
    }

    /**
     * Lưu file media của promotion vào thư mục promotions/
     * @param file File cần lưu
     * @return URL của file đã lưu
     */
    public String storePromotionMedia(MultipartFile file) {
        return storeFile(file, PROMOTION_MEDIA_DIR, PROMOTION_MEDIA_URL);
    }

    /**
     * Lưu file avatar/profile vào thư mục profile_media/
     * @param file File cần lưu
     * @return URL của file đã lưu
     */
    public String storeProfileMedia(MultipartFile file) {
        return storeFile(file, PROFILE_MEDIA_DIR, PROFILE_MEDIA_URL);
    }

    /**
     * Xóa file avatar/profile dựa trên URL
     * @param url URL của file cần xóa
     */
    public void deleteProfileMedia(String url) {
        if (url == null || url.isBlank()) {
            return;
        }
        
        try {
            String filename = null;
            
            // Parse URL để lấy filename
            try {
                java.net.URI uri = java.net.URI.create(url);
                String path = uri.getPath();
                if (path != null && !path.isBlank()) {
                    // Loại bỏ context path nếu có (ví dụ: /lumina_book)
                    if (path.startsWith("/lumina_book")) {
                        path = path.substring("/lumina_book".length());
                    }
                    // Tìm phần path sau /profile_media/
                    if (path.contains(PROFILE_MEDIA_URL)) {
                        int profileIndex = path.indexOf(PROFILE_MEDIA_URL);
                        filename = path.substring(profileIndex + PROFILE_MEDIA_URL.length());
                    } else {
                        // Nếu không có /profile_media/, lấy filename từ cuối path
                        int lastSlash = path.lastIndexOf('/');
                        if (lastSlash >= 0 && lastSlash < path.length() - 1) {
                            filename = path.substring(lastSlash + 1);
                        }
                    }
                }
            } catch (IllegalArgumentException ignored) {
                // Nếu không parse được URI, thử parse trực tiếp từ URL string
            }

            // Fallback: nếu không parse được từ URI, thử parse từ URL string
            if (filename == null || filename.isBlank()) {
                String path = url;
                if (path.startsWith("/")) {
                    path = path.substring(1);
                }
                if (path.startsWith("uploads/profile_media/")) {
                    filename = path.substring("uploads/profile_media/".length());
                } else if (path.startsWith("profile_media/")) {
                    filename = path.substring("profile_media/".length());
                } else if (path.contains("/profile_media/")) {
                    int index = path.indexOf("/profile_media/");
                    filename = path.substring(index + "/profile_media/".length());
                }
            }

            // Nếu vẫn không có filename, và URL không chứa "/", coi như URL chính là filename
            if ((filename == null || filename.isBlank()) && !url.contains("/")) {
                filename = url;
            }

            if (filename == null || filename.isBlank()) {
                log.warn("Could not extract filename from URL: {}", url);
                return;
            }

            // Xóa file từ thư mục profile_media
            Path filePath = Paths.get(PROFILE_MEDIA_DIR, filename);
            boolean deleted = Files.deleteIfExists(filePath);

            if (deleted) {
                log.info("Deleted profile media file: {}", filePath.toAbsolutePath());
            } else {
                // Thử xóa từ thư mục legacy nếu có
                Path legacyPath = Paths.get("profile_media", filename);
                deleted = Files.deleteIfExists(legacyPath);
                if (deleted) {
                    log.info("Deleted profile media file from legacy folder: {}", legacyPath.toAbsolutePath());
                } else {
                    log.warn("Profile media file not found: {}", filename);
                }
            }
        } catch (Exception e) {
            log.warn("Could not delete profile media file for url {}: {}", url, e.getMessage());
        }
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
            log.debug("File stored successfully: {}", url);
            return url;
        } catch (IOException e) {
            log.error("Failed to store file: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        }
    }
}


