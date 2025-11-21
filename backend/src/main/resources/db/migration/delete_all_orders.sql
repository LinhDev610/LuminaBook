-- Script để xóa toàn bộ đơn hàng và các bản ghi liên quan
-- CẢNH BÁO: Script này sẽ xóa TẤT CẢ dữ liệu đơn hàng trong database!
-- Hãy chắc chắn bạn đã backup database trước khi chạy script này.

-- Tắt chế độ safe update để cho phép xóa hàng loạt
SET SQL_SAFE_UPDATES = 0;

-- Bắt đầu transaction để đảm bảo tính toàn vẹn dữ liệu
START TRANSACTION;

-- Xóa các bản ghi liên quan theo thứ tự (tránh lỗi foreign key constraint)

-- 1. Xóa chi tiết đơn hàng (order_items)
DELETE FROM order_items;
SELECT CONCAT('Đã xóa ', ROW_COUNT(), ' bản ghi từ order_items') AS result;

-- 2. Xóa thông tin vận chuyển (shipments)
DELETE FROM shipments;
SELECT CONCAT('Đã xóa ', ROW_COUNT(), ' bản ghi từ shipments') AS result;

-- 3. Xóa bản ghi tài chính liên quan đến đơn hàng (financial_records)
DELETE FROM financial_records WHERE order_id IS NOT NULL;
SELECT CONCAT('Đã xóa ', ROW_COUNT(), ' bản ghi từ financial_records') AS result;

-- 4. Xóa thông tin thanh toán (payments)
DELETE FROM payments WHERE order_id IS NOT NULL;
SELECT CONCAT('Đã xóa ', ROW_COUNT(), ' bản ghi từ payments') AS result;

-- 5. Cuối cùng, xóa tất cả đơn hàng (orders)
DELETE FROM orders;
SELECT CONCAT('Đã xóa ', ROW_COUNT(), ' bản ghi từ orders') AS result;

-- Xác nhận transaction
COMMIT;

-- Bật lại chế độ safe update
SET SQL_SAFE_UPDATES = 1;

-- Hiển thị kết quả
SELECT 'Đã xóa toàn bộ đơn hàng và dữ liệu liên quan!' AS message;

