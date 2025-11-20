package com.lumina_book.backend.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// Chỉ cho Spring biết, nếu người dùng gõ url bắt đầu bằng:
/*
    /promotion_media/… → hãy vào thư mục uploads/promotions/ trên máy, tìm file và trả về đúng file tương ứng.
    /voucher_media/... → thư mục uploads/vouchers/
    /product_media/... → thư mục uploads/product_media/
    /promotion_media/... → thư mục uploads/promotions/
    /vouchers/** → thư mục uploads/vouchers/
    /promotions/** → thư mục uploads/promotions/
*/
@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Khi client request đến /product_media/**, Spring sẽ serve file từ thư mục product_media/ trong project.
        registry.addResourceHandler("/product_media/**")
                .addResourceLocations("file:uploads/product_media/");

        // Khi client request đến /profile_media/**, serve file avatar người dùng.
        registry.addResourceHandler("/profile_media/**")
                .addResourceLocations("file:uploads/profile_media/");

        // Khi client request đến /voucher_media/**, Spring sẽ serve file từ thư mục vouchers/ trong project.
        registry.addResourceHandler("/voucher_media/**")
                .addResourceLocations("file:uploads/vouchers/");

        // Khi client request đến /promotion_media/**, Spring sẽ serve file từ thư mục promotions/ trong project.
        registry.addResourceHandler("/promotion_media/**")
                .addResourceLocations("file:uploads/promotions/");

        // Khi client request đến /vouchers/** và /promotions/**, Spring sẽ serve file từ thư mục vouchers/ và promotions/ trong project.
        registry.addResourceHandler("/vouchers/**")
                .addResourceLocations("file:uploads/vouchers/");

        registry.addResourceHandler("/promotions/**")
                .addResourceLocations("file:uploads/promotions/");

        // Truy cập trực tiếp /uploads/** → tìm file trong thư mục uploads/
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");

        // Handle assets folder (static resources như images, css, js)
        registry.addResourceHandler("/assets/**")
                .addResourceLocations("classpath:/static/assets/", "file:assets/");

        // Nếu muốn hỗ trợ truy cập trực tiếp bằng UUID filename (vd: 17e7...08.png),
        // bạn có thể bật lại block bên dưới nhưng cần đảm bảo file thực sự tồn tại trong thư mục uploads.
        // Hiện tại block này bị tắt để tránh log lỗi NoResourceFoundException khi client request tới
        // các file không tồn tại như f507172a-7fb7-4f0d-bf43-8eedbcc51dd4.png.
//        String[] extensions = { "png", "jpg", "jpeg", "gif", "webp", "mp4" };
//        for (String ext : extensions) {
//            registry.addResourceHandler("/*." + ext)
//                    .addResourceLocations(
//                            "file:uploads/promotions/",
//                            "file:uploads/vouchers/",
//                            "file:uploads/product_media/",
//                            "file:uploads/profile_media/"
//                    );
//        }
    }
}




