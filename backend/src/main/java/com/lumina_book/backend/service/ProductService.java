package com.lumina_book.backend.service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Comparator;

import java.time.LocalDateTime;
import java.time.LocalDate;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lumina_book.backend.entity.*;

import com.lumina_book.backend.dto.request.ApproveProductRequest;
import com.lumina_book.backend.dto.request.ProductCreationRequest;
import com.lumina_book.backend.dto.request.ProductRestockRequest;
import com.lumina_book.backend.dto.request.ProductUpdateRequest;
import com.lumina_book.backend.dto.response.ProductResponse;
import com.lumina_book.backend.enums.ProductStatus;
import com.lumina_book.backend.enums.PromotionStatus;
import com.lumina_book.backend.exception.AppException;
import com.lumina_book.backend.exception.ErrorCode;
import com.lumina_book.backend.mapper.ProductMapper;
import com.lumina_book.backend.repository.ProductMediaRepository;
import com.lumina_book.backend.repository.CategoryRepository;
import com.lumina_book.backend.repository.ProductRepository;
import com.lumina_book.backend.repository.PromotionRepository;
import com.lumina_book.backend.repository.VoucherRepository;
import com.lumina_book.backend.repository.UserRepository;
import com.lumina_book.backend.repository.BannerRepository;
import com.lumina_book.backend.repository.FinancialRecordRepository;
import com.lumina_book.backend.util.SecurityUtil;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ProductService {

    ProductRepository productRepository;
    CategoryRepository categoryRepository;
    UserRepository userRepository;
    ProductMediaRepository productMediaRepository;
    PromotionRepository promotionRepository;
    VoucherRepository voucherRepository;
    BannerRepository bannerRepository;
    FinancialRecordRepository financialRecordRepository;
    ProductMapper productMapper;
    PromotionService promotionService;

    // ========== CREATE OPERATIONS ==========
    @Transactional
    @PreAuthorize("hasRole('STAFF')")
    public ProductResponse createProduct(ProductCreationRequest request) {
        String userEmail = SecurityUtil.getCurrentUserEmail();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Validate và lấy category
        Category category = categoryRepository
                .findById(request.getCategoryId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));

        // Validate và lấy promotion nếu có
        Promotion promotion = null;
        if (request.getPromotionId() != null && !request.getPromotionId().isEmpty()) {
            promotion = promotionRepository
                    .findById(request.getPromotionId())
                    .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
        }

        // Tạo product entity từ request
        Product product = productMapper.toProduct(request);
        product.setId(request.getId());
        product.setSubmittedBy(user);
        product.setCategory(category);
        product.setPromotion(promotion);
        product.setCreatedAt(LocalDateTime.now());
        product.setUpdatedAt(LocalDateTime.now());
        product.setQuantitySold(0);
        product.setStatus(ProductStatus.PENDING);

        // Tính toán giá sản phẩm
        if (request.getUnitPrice() == null || request.getUnitPrice() < 0) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
        product.setUnitPrice(request.getUnitPrice());
        Double explicitPrice = request.getPrice();
        double finalPrice = (explicitPrice != null && explicitPrice >= 0)
                ? explicitPrice
                : computeFinalPrice(request.getUnitPrice(), request.getTax(), request.getDiscountValue());
        product.setPrice(finalPrice);

        // Khởi tạo tồn kho nếu có số lượng ban đầu
        if (request.getStockQuantity() != null) {
            Inventory inventory = Inventory.builder()
                    .stockQuantity(request.getStockQuantity())
                    .lastUpdated(LocalDate.now())
                    .product(product)
                    .build();
            product.setInventory(inventory);
        }

        // Gắn media (ảnh/video) từ request
        attachMediaFromRequest(product, request);

        // Lưu sản phẩm
        try {
            Product savedProduct = productRepository.save(product);
            log.info("Product created with ID: {} by user: {}", savedProduct.getId(), user.getId());
            return productMapper.toResponse(savedProduct);
        } catch (DataIntegrityViolationException e) {
            log.error("Data integrity violation when creating product", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    // ========== UPDATE OPERATIONS ==========

    /**
     * Cập nhật thông tin sản phẩm
     * Staff chỉ có thể cập nhật sản phẩm của chính họ
     * Admin có thể cập nhật bất kỳ sản phẩm nào
     */
    @Transactional
    public ProductResponse updateProduct(String productId, ProductUpdateRequest request) {
        Authentication authentication = SecurityUtil.getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Product product = productRepository
                .findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));

        // Kiểm tra quyền: Admin hoặc chủ sở hữu sản phẩm
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && !product.getSubmittedBy().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Cập nhật thông tin sản phẩm
        productMapper.updateProduct(product, request);
        product.setUpdatedAt(LocalDateTime.now());

        boolean unitPriceChanged = request.getUnitPrice() != null;
        boolean taxChanged = request.getTax() != null;
        boolean discountChanged = request.getDiscountValue() != null;
        boolean priceProvided = request.getPrice() != null;

        if (priceProvided && request.getPrice() != null && request.getPrice() >= 0) {
            product.setPrice(request.getPrice());
        } else if (unitPriceChanged || taxChanged || discountChanged) {
            Double unitPrice = product.getUnitPrice();
            Double tax = product.getTax();
            Double discountValue = product.getDiscountValue();

            if (unitPrice != null && unitPrice >= 0) {
                product.setPrice(computeFinalPrice(unitPrice, tax, discountValue));
            }
        }

        // Cập nhật category nếu có
        if (request.getCategoryId() != null && !request.getCategoryId().isEmpty()) {
            Category category = categoryRepository
                    .findById(request.getCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));
            product.setCategory(category);
        }

        // Cập nhật promotion nếu có
        if (request.getPromotionId() != null) {
            if (request.getPromotionId().isEmpty()) {
                // Nếu promotionId là chuỗi rỗng, xóa promotion
                product.setPromotion(null);
            } else {
                Promotion promotion = promotionRepository
                        .findById(request.getPromotionId())
                        .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
                product.setPromotion(promotion);
            }
        }

        // Cập nhật inventory nếu có
        if (request.getStockQuantity() != null) {
            if (product.getInventory() == null) {
                Inventory inventory = Inventory.builder()
                        .stockQuantity(request.getStockQuantity())
                        .lastUpdated(java.time.LocalDate.now())
                        .product(product)
                        .build();
                product.setInventory(inventory);
            } else {
                product.getInventory().setStockQuantity(request.getStockQuantity());
                product.getInventory().setLastUpdated(java.time.LocalDate.now());
            }
        }

        // Cập nhật media nếu có
        if (request.getImageUrls() != null || request.getVideoUrls() != null) {
            // Thu thập tất cả URLs từ request (cả image và video)
            java.util.Set<String> newMediaUrls = new java.util.HashSet<>();
            if (request.getImageUrls() != null) {
                newMediaUrls.addAll(request.getImageUrls());
            }
            if (request.getVideoUrls() != null) {
                newMediaUrls.addAll(request.getVideoUrls());
            }
            
            // Xóa media cũ và file vật lý
            // Logic: Nếu existing media bị user xóa trong frontend, URL đó sẽ không có trong request
            // → Backend sẽ xóa file vật lý của những media không có trong request mới
            if (product.getMediaList() != null && !product.getMediaList().isEmpty()) {
                int deletedFileCount = 0;
                // Chỉ xóa file vật lý của những media không có trong request mới
                // (bao gồm cả existing media bị user xóa và media thực sự bị thay thế)
                for (ProductMedia oldMedia : product.getMediaList()) {
                    String oldUrl = oldMedia.getMediaUrl();
                    // Chỉ xóa file nếu URL không có trong request mới
                    if (oldUrl != null && !newMediaUrls.contains(oldUrl)) {
                        deletePhysicalFileByUrl(oldUrl);
                        deletedFileCount++;
                        log.info("Deleted physical file for removed media: {}", oldUrl);
                    }
                }
                if (deletedFileCount > 0) {
                    log.info("Deleted {} physical media files for product {} (removed by user or replaced)", 
                            deletedFileCount, productId);
                }
                // Clear collection trước khi xóa để tránh lỗi Hibernate orphan removal
                List<ProductMedia> oldMediaList = new ArrayList<>(product.getMediaList());
                product.getMediaList().clear();
                // Xóa media khỏi database
                productMediaRepository.deleteAll(oldMediaList);
                log.info("Deleted {} ProductMedia records from database for product {}", 
                        oldMediaList.size(), productId);
            }
            // Gắn media mới từ request (bao gồm cả media cũ và mới)
            attachMediaFromUpdateRequest(product, request);
        }

        // Cập nhật status nếu có trong request
        if (request.getStatus() != null) {
            product.setStatus(request.getStatus());
        }

        Product savedProduct = productRepository.save(product);
        log.info("Product updated: {} by user: {}", productId, user.getEmail());
        return productMapper.toResponse(savedProduct);
    }

    @Transactional
    public ProductResponse restockProduct(String productId, ProductRestockRequest request) {
        Authentication authentication = SecurityUtil.getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Product product = productRepository
                .findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && !product.getSubmittedBy().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        int quantityToAdd = request.getQuantity();
        if (quantityToAdd <= 0) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        Inventory inventory = product.getInventory();
        if (inventory == null) {
            inventory = Inventory.builder()
                    .stockQuantity(quantityToAdd)
                    .lastUpdated(LocalDate.now())
                    .product(product)
                    .build();
            product.setInventory(inventory);
        } else {
            int currentStock = inventory.getStockQuantity() != null ? inventory.getStockQuantity() : 0;
            inventory.setStockQuantity(currentStock + quantityToAdd);
            inventory.setLastUpdated(LocalDate.now());
        }

        product.setUpdatedAt(LocalDateTime.now());
        Product savedProduct = productRepository.save(product);
        return productMapper.toResponse(savedProduct);
    }

    // ========== DELETE OPERATIONS ==========
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteProduct(String productId) {
        String userEmail = SecurityUtil.getCurrentUserEmail();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Load product với tất cả relations để đảm bảo có thể xóa đúng cách
        Product product = productRepository
                .findByIdWithRelations(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));

        // 1. Xóa product khỏi tất cả Promotion.productApply (bảng promotion_products)
        List<Promotion> promotionsWithProduct = promotionRepository.findByProductId(productId);
        for (Promotion promotion : promotionsWithProduct) {
            promotion.getProductApply().remove(product);
            promotionRepository.save(promotion);
        }

        // 2. Xóa product khỏi tất cả Voucher.productApply (bảng voucher_products)
        // Tìm tất cả vouchers có product này
        List<Voucher> vouchersWithProduct = voucherRepository.findByProductId(productId);
        for (Voucher voucher : vouchersWithProduct) {
            voucher.getProductApply().remove(product);
            voucherRepository.save(voucher);
        }

        // 3. Xóa product khỏi tất cả Banner.products (bảng banner_products)
        // Force load banners collection nếu chưa được load
        if (product.getBanners() != null) {
            product.getBanners().size(); // Trigger lazy loading
            List<Banner> bannersWithProduct = new ArrayList<>(product.getBanners());
            for (Banner banner : bannersWithProduct) {
                if (banner.getProducts() != null) {
                    banner.getProducts().remove(product);
                    bannerRepository.save(banner);
                }
            }
        }

        // 4. Set product.promotion = null (nếu có promotion trực tiếp)
        if (product.getPromotion() != null) {
            product.setPromotion(null);
            productRepository.save(product);
        }

        // 5. Xóa hoặc set null product trong FinancialRecord (tránh foreign key constraint)
        List<FinancialRecord> financialRecords = financialRecordRepository.findByProductId(productId);
        if (!financialRecords.isEmpty()) {
            for (FinancialRecord record : financialRecords) {
                record.setProduct(null);
            }
            financialRecordRepository.saveAll(financialRecords);
            log.info("Set product to null for {} financial records before deleting product {}", 
                    financialRecords.size(), productId);
        }

        // 6. Set default_media_id = null trước khi xóa ProductMedia (tránh foreign key constraint)
        if (product.getDefaultMedia() != null) {
            product.setDefaultMedia(null);
            productRepository.saveAndFlush(product); // Flush ngay để đảm bảo thay đổi được ghi vào DB
            log.info("Set default_media_id to null for product {} before deleting media", productId);
        }

        // 7. Xóa file media vật lý trong thư mục product_media (nếu có)
        deleteMediaFilesIfExists(product);

        // 8. Xóa tất cả ProductMedia records (tránh foreign key constraint)
        // Load mediaList để đảm bảo được fetch
        if (product.getMediaList() != null) {
            product.getMediaList().size(); // Trigger lazy loading nếu cần
        }
        
        // Xóa từng ProductMedia record thủ công thay vì dùng query để tránh foreign key constraint
        List<ProductMedia> mediaList = productMediaRepository.findByProductIdOrderByDisplayOrderAsc(productId);
        if (!mediaList.isEmpty()) {
            // Clear collection trước khi xóa để tránh lỗi Hibernate orphan removal
            if (product.getMediaList() != null) {
                product.getMediaList().clear();
            }
            // Xóa media khỏi database
            productMediaRepository.deleteAll(mediaList);
            productMediaRepository.flush(); // Flush để đảm bảo xóa được thực hiện ngay
            log.info("Deleted {} ProductMedia records for product {}", mediaList.size(), productId);
        }

        // 9. Xóa product
        productRepository.delete(product);
        log.info("Product deleted: {} by user: {}", productId, user.getEmail());
    }

    // ========== READ OPERATIONS ==========
    public ProductResponse getProductById(String productId) {
        Product product = productRepository
                .findByIdWithRelations(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));
        
        // Tìm promotion active cho sản phẩm này
        Promotion activePromotion = findActivePromotionForProduct(product);
        
        // Nếu có promotion active, set vào product
        if (activePromotion != null) {
            product.setPromotion(activePromotion);
        } else {
            // Nếu không có promotion active, set null
            product.setPromotion(null);
        }
        
        return productMapper.toResponse(product);
    }

    // Tìm promotion đang active cho sản phẩm (theo product trực tiếp hoặc theo category)
    private Promotion findActivePromotionForProduct(Product product) {
        LocalDate today = LocalDate.now();
        List<Promotion> activePromotions = new ArrayList<>();
        
        // 1. Kiểm tra promotion trực tiếp của product
        if (product.getPromotion() != null) {
            Promotion directPromo = product.getPromotion();
            if (isPromotionActive(directPromo, today)) {
                activePromotions.add(directPromo);
            }
        }
        
        // 2. Tìm promotion active theo product ID (từ promotion_products table)
        if (product.getId() != null) {
            List<Promotion> productPromotions = promotionRepository.findActiveByProductId(product.getId(), today);
            activePromotions.addAll(productPromotions);
        }
        
        // 3. Tìm promotion active theo category
        if (product.getCategory() != null && product.getCategory().getId() != null) {
            List<Promotion> categoryPromotions = promotionRepository.findActiveByCategoryId(product.getCategory().getId(), today);
            activePromotions.addAll(categoryPromotions);
        }
        
        // Loại bỏ trùng lặp và lấy promotion có startDate sớm nhất (ưu tiên promotion bắt đầu sớm hơn)
        return activePromotions.stream()
                .distinct()
                .filter(p -> isPromotionActive(p, today))
                .min(Comparator.comparing(Promotion::getStartDate, 
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null);
    }

    // Kiểm tra promotion có đang active không
    private boolean isPromotionActive(Promotion promotion, LocalDate today) {
        if (promotion == null) return false;
        
        // Phải là APPROVED và isActive = true
        if (promotion.getStatus() != PromotionStatus.APPROVED) {
            return false;
        }
        if (!promotion.getIsActive()) {
            return false;
        }
        
        // Kiểm tra thời gian: startDate <= today <= expiryDate
        if (promotion.getStartDate() != null && promotion.getStartDate().isAfter(today)) {
            return false; // Chưa đến ngày bắt đầu
        }
        if (promotion.getExpiryDate() != null && promotion.getExpiryDate().isBefore(today)) {
            return false; // Đã hết hạn
        }
        
        return true;
    }

    public List<ProductResponse> getAllProducts() {
        List<Product> products = productRepository.findAll();
        return products.stream().map(productMapper::toResponse).toList();
    }

    public List<ProductResponse> getActiveProducts() {
        // Chỉ lấy products có status APPROVED (không lấy DISABLED)
        List<Product> products = productRepository.findByStatus(ProductStatus.APPROVED);
        return products.stream().map(productMapper::toResponse).toList();
    }

    public List<ProductResponse> getProductsByCategory(String categoryId) {
        List<Product> products = productRepository.findByCategoryId(categoryId);
        return products.stream()
                .filter(p -> p.getStatus() == ProductStatus.APPROVED)
                .map(productMapper::toResponse)
                .toList();
    }

    public List<ProductResponse> searchProducts(String keyword) {
        List<Product> products = productRepository.findByKeyword(keyword);
        return products.stream()
                .filter(p -> p.getStatus() == ProductStatus.APPROVED)
                .map(productMapper::toResponse)
                .toList();
    }

    public List<ProductResponse> getProductsByPriceRange(Double minPrice, Double maxPrice) {
        List<Product> products = productRepository.findByPriceRange(minPrice, maxPrice);
        return products.stream()
                .filter(p -> p.getStatus() == ProductStatus.APPROVED)
                .map(productMapper::toResponse)
                .toList();
    }

    public List<ProductResponse> getMyProducts() {
        String userEmail = SecurityUtil.getCurrentUserEmail();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        List<Product> products = productRepository.findBySubmittedBy(user);
        return products.stream().map(productMapper::toResponse).toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<ProductResponse> getPendingProducts() {
        List<Product> products = productRepository.findByStatus(ProductStatus.PENDING);
        return products.stream().map(productMapper::toResponse).toList();
    }

    // ========== APPROVAL OPERATIONS ==========

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public ProductResponse approveProduct(ApproveProductRequest request) {
        String adminEmail = SecurityUtil.getCurrentUserEmail();
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Product product = productRepository
                .findById(request.getProductId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));

        // Xử lý approve, reject, disable hoặc enable
        if ("APPROVE".equals(request.getAction())) {
            product.setStatus(ProductStatus.APPROVED);
            product.setApprovedBy(admin);
            product.setApprovedAt(LocalDateTime.now());
            product.setRejectionReason(null);
            product.setUpdatedAt(LocalDateTime.now());
            
            if (product.getPromotion() == null) {
                promotionService.applyCategoryPromotionToProduct(product);
            }
        } else if ("REJECT".equals(request.getAction())) {
            product.setStatus(ProductStatus.REJECTED);
            product.setApprovedBy(null);
            product.setApprovedAt(null);
            product.setRejectionReason(request.getReason());
            product.setUpdatedAt(LocalDateTime.now());
            log.info("Product rejected: {} by admin: {}", product.getId(), adminEmail);
        } else if ("DISABLE".equals(request.getAction())) {
            product.setStatus(ProductStatus.DISABLED);
            product.setUpdatedAt(LocalDateTime.now());
        } else if ("ENABLE".equals(request.getAction())) {
            product.setStatus(ProductStatus.APPROVED);
            product.setUpdatedAt(LocalDateTime.now());
            
            // Khi enable lại sản phẩm, cũng kiểm tra và áp dụng promotion theo category
            if (product.getPromotion() == null) {
                promotionService.applyCategoryPromotionToProduct(product);
            }
        }

        Product savedProduct = productRepository.save(product);
        return productMapper.toResponse(savedProduct);
    }

    // ========== MEDIA OPERATIONS ==========
    @Transactional
    public ProductResponse setDefaultMedia(String productId, String mediaUrl) {
        Authentication authentication = SecurityUtil.getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Product product = productRepository
                .findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && !product.getSubmittedBy().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        var mediaOpt = productMediaRepository.findByProductIdAndMediaUrl(productId, mediaUrl);
        if (mediaOpt.isEmpty()) {
            throw new AppException(ErrorCode.PRODUCT_NOT_EXISTED);
        }
        var media = mediaOpt.get();

        // Reorder displayOrder so that selected media is first (0) and others shift down
        List<ProductMedia> medias = productMediaRepository.findByProductIdOrderByDisplayOrderAsc(productId);
        int order = 1; // start from 1 for non-default
        for (ProductMedia m : medias) {
            if (m.getId().equals(media.getId())) {
                m.setDisplayOrder(0);
                m.setDefault(true);
            } else {
                m.setDisplayOrder(order++);
                m.setDefault(false);
            }
            productMediaRepository.save(m);
        }

        // Update product defaultMedia reference
        product.setDefaultMedia(media);
        Product saved = productRepository.save(product);
        return productMapper.toResponse(saved);
    }

    // ========== PRIVATE HELPER METHODS ==========
    private Double computeFinalPrice(Double unitPrice, Double taxNullable, Double discountNullable) {
        double tax = (taxNullable != null && taxNullable >= 0) ? taxNullable : 0.0;
        double discount = (discountNullable != null && discountNullable >= 0) ? discountNullable : 0.0;
        double finalPrice = unitPrice * (1 + tax) - discount;
        return Math.max(0, finalPrice); // Đảm bảo giá không âm
    }

    private void attachMediaFromRequest(Product product, ProductCreationRequest request) {
        List<ProductMedia> mediaEntities = new ArrayList<>();
        ProductMedia defaultMedia = null;
        int displayOrder = 0;

        // Xử lý ảnh
        if (request.getImageUrls() != null) {
            for (String url : request.getImageUrls()) {
                if (url == null || url.isBlank()) continue;
                ProductMedia media = ProductMedia.builder()
                        .mediaUrl(url)
                        .mediaType("IMAGE")
                        .isDefault(url.equals(request.getDefaultMediaUrl()))
                        .displayOrder(displayOrder++)
                        .product(product)
                        .build();
                if (media.isDefault()) defaultMedia = media;
                mediaEntities.add(media);
            }
        }

        // Xử lý video
        if (request.getVideoUrls() != null) {
            for (String url : request.getVideoUrls()) {
                if (url == null || url.isBlank()) continue;
                ProductMedia media = ProductMedia.builder()
                        .mediaUrl(url)
                        .mediaType("VIDEO")
                        .isDefault(url.equals(request.getDefaultMediaUrl()))
                        .displayOrder(displayOrder++)
                        .product(product)
                        .build();
                if (media.isDefault()) defaultMedia = media;
                mediaEntities.add(media);
            }
        }

        // Gắn media vào product
        if (!mediaEntities.isEmpty()) {
            // Clear collection hiện có trước (nếu có) để tránh lỗi Hibernate
            if (product.getMediaList() == null) {
                product.setMediaList(new ArrayList<>());
            } else {
                product.getMediaList().clear();
            }
            // Add tất cả media mới vào collection hiện có
            product.getMediaList().addAll(mediaEntities);
            // Nếu không có media nào được đánh dấu là default, chọn media đầu tiên
            if (defaultMedia == null) {
                defaultMedia = mediaEntities.get(0);
                defaultMedia.setDefault(true);
            }
            product.setDefaultMedia(defaultMedia);
        }
    }

    private void attachMediaFromUpdateRequest(Product product, ProductUpdateRequest request) {
        List<ProductMedia> mediaEntities = new ArrayList<>();
        ProductMedia defaultMedia = null;
        int displayOrder = 0;

        // Xử lý ảnh
        if (request.getImageUrls() != null) {
            for (String url : request.getImageUrls()) {
                if (url == null || url.isBlank()) continue;
                ProductMedia media = ProductMedia.builder()
                        .mediaUrl(url)
                        .mediaType("IMAGE")
                        .isDefault(url.equals(request.getDefaultMediaUrl()))
                        .displayOrder(displayOrder++)
                        .product(product)
                        .build();
                if (media.isDefault()) defaultMedia = media;
                mediaEntities.add(media);
            }
        }

        // Xử lý video
        if (request.getVideoUrls() != null) {
            for (String url : request.getVideoUrls()) {
                if (url == null || url.isBlank()) continue;
                ProductMedia media = ProductMedia.builder()
                        .mediaUrl(url)
                        .mediaType("VIDEO")
                        .isDefault(url.equals(request.getDefaultMediaUrl()))
                        .displayOrder(displayOrder++)
                        .product(product)
                        .build();
                if (media.isDefault()) defaultMedia = media;
                mediaEntities.add(media);
            }
        }

        // Gắn media vào product
        if (!mediaEntities.isEmpty()) {
            // Clear collection hiện có trước (nếu có) để tránh lỗi Hibernate
            if (product.getMediaList() == null) {
                product.setMediaList(new ArrayList<>());
            } else {
                product.getMediaList().clear();
            }
            // Add tất cả media mới vào collection hiện có
            product.getMediaList().addAll(mediaEntities);
            // Nếu không có media nào được đánh dấu là default, chọn media đầu tiên
            if (defaultMedia == null) {
                defaultMedia = mediaEntities.get(0);
                defaultMedia.setDefault(true);
            }
            product.setDefaultMedia(defaultMedia);
        }
    }

    private void deleteMediaFilesIfExists(Product product) {
        try {
            if (product.getMediaList() != null) {
                for (ProductMedia media : product.getMediaList()) {
                    deletePhysicalFileByUrl(media.getMediaUrl());
                }
            }
            if (product.getDefaultMedia() != null) {
                deletePhysicalFileByUrl(product.getDefaultMedia().getMediaUrl());
            }
        } catch (Exception e) {
            log.warn("Failed to delete media files for product {}: {}", product.getId(), e.getMessage());
        }
    }

    private void deletePhysicalFileByUrl(String url) {
        if (url == null || url.isBlank()) return;
        try {
            String filename = null;
            try {
                java.net.URI uri = java.net.URI.create(url);
                String path = uri.getPath();
                if (path != null && !path.isBlank()) {
                    int lastSlash = path.lastIndexOf('/');
                    if (lastSlash >= 0 && lastSlash < path.length() - 1) {
                        filename = path.substring(lastSlash + 1);
                    }
                }
            } catch (IllegalArgumentException ignored) { }

            if (filename == null) {
                String path = url;
                if (path.startsWith("/")) path = path.substring(1);
                if (path.startsWith("uploads/product_media/")) {
                    filename = path.substring("uploads/product_media/".length());
                } else if (path.startsWith("product_media/")) {
                    filename = path.substring("product_media/".length());
                }
            }

            if (filename == null && !url.contains("/")) {
                filename = url;
            }

            if (filename == null || filename.isBlank()) return;

            // Xác định thư mục dựa trên URL (mặc định là uploads/product_media)
            Path targetDir = Paths.get("uploads", "product_media");
            Path filePath = targetDir.resolve(filename);
            boolean deleted = Files.deleteIfExists(filePath);

            if (!deleted) {
                Path legacyDir = Paths.get("product_media");
                Path legacyPath = legacyDir.resolve(filename);
                deleted = Files.deleteIfExists(legacyPath);
                if (deleted) {
                    log.info("Deleted media file from legacy folder: {}", legacyPath.toAbsolutePath());
                }
            } else {
                log.info("Deleted media file: {}", filePath.toAbsolutePath());
            }
        } catch (Exception e) {
            log.warn("Could not delete media file for url {}: {}", url, e.getMessage());
        }
    }
}
