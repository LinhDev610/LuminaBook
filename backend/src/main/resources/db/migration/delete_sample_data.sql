-- Script để xóa dữ liệu mẫu có tham chiếu đến file ảnh không tồn tại
-- CẢNH BÁO: Script này sẽ xóa các banner/product có media URL không hợp lệ!

SET SQL_SAFE_UPDATES = 0;

START TRANSACTION;

-- Xóa các banner có image URL chứa "img_kinangsong" hoặc các file không tồn tại
DELETE FROM banners 
WHERE image_url LIKE '%img_kinangsong%' 
   OR image_url LIKE '%images/img_kinangsong%'
   OR image_url LIKE '%/images/%'
   OR image_url IS NULL
   OR image_url = '';

SELECT CONCAT('Đã xóa ', ROW_COUNT(), ' banner có image URL không hợp lệ') AS result;

-- Xóa các product có media URL chứa "img_kinangsong" hoặc các file không tồn tại
-- (nếu có cột media_url trong bảng products)
-- DELETE FROM products 
-- WHERE media_url LIKE '%img_kinangsong%' 
--    OR media_url LIKE '%images/img_kinangsong%'
--    OR media_url LIKE '%/images/%'
--    OR media_url IS NULL
--    OR media_url = '';

-- Xóa các product_media có media_url chứa "img_kinangsong" hoặc các file không tồn tại
DELETE FROM product_media 
WHERE media_url LIKE '%img_kinangsong%' 
   OR media_url LIKE '%images/img_kinangsong%'
   OR media_url LIKE '%/images/%'
   OR media_url IS NULL
   OR media_url = '';

SELECT CONCAT('Đã xóa ', ROW_COUNT(), ' product_media có URL không hợp lệ') AS result;

COMMIT;

SET SQL_SAFE_UPDATES = 1;

SELECT 'Đã xóa dữ liệu mẫu có media URL không hợp lệ!' AS message;

