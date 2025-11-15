-- Script để xóa cột code khỏi bảng promotions và expired_promotions
-- Chạy script này trong MySQL để cập nhật database schema

USE lumina_book;

-- Xóa cột code khỏi bảng promotions
ALTER TABLE promotions DROP COLUMN IF EXISTS code;

-- Xóa cột code khỏi bảng expired_promotions
ALTER TABLE expired_promotions DROP COLUMN IF EXISTS code;

-- Xóa unique constraint trên code nếu còn tồn tại (MySQL có thể tự động xóa khi xóa cột)
-- Nếu có lỗi về constraint, có thể cần chạy:
-- ALTER TABLE promotions DROP INDEX IF EXISTS UK_promotions_code;

