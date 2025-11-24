-- Script để xóa toàn bộ đơn hàng
-- Sử dụng database: lumina_book
-- LƯU Ý: Script này sẽ xóa TẤT CẢ đơn hàng và dữ liệu liên quan. Hãy cẩn thận!

USE lumina_book;

-- ============================================
-- XÓA TOÀN BỘ ĐƠN HÀNG
-- ============================================

-- Bước 1: Xóa order_items (bảng con)
DELETE FROM order_items;

-- Bước 2: Xóa shipments (bảng con)
DELETE FROM shipments;

-- Bước 3: Xóa orders (bảng chính)
DELETE FROM orders;

-- ============================================
-- KIỂM TRA SAU KHI XÓA
-- ============================================
-- Chạy các lệnh sau để kiểm tra:
-- SELECT COUNT(*) FROM orders;
-- SELECT COUNT(*) FROM order_items;
-- SELECT COUNT(*) FROM shipments;

-- ============================================
-- XÓA THEO ĐIỀU KIỆN (Nếu cần)
-- ============================================

-- Xóa đơn hàng theo trạng thái
-- DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE status = 'CANCELLED');
-- DELETE FROM shipments WHERE order_id IN (SELECT id FROM orders WHERE status = 'CANCELLED');
-- DELETE FROM orders WHERE status = 'CANCELLED';

-- Xóa đơn hàng theo ngày
-- DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE order_date < '2024-01-01');
-- DELETE FROM shipments WHERE order_id IN (SELECT id FROM orders WHERE order_date < '2024-01-01');
-- DELETE FROM orders WHERE order_date < '2024-01-01';

-- Xóa đơn hàng theo mã đơn hàng
-- DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE order_code = 'LMN20251123-XXXXXX');
-- DELETE FROM shipments WHERE order_id IN (SELECT id FROM orders WHERE order_code = 'LMN20251123-XXXXXX');
-- DELETE FROM orders WHERE order_code = 'LMN20251123-XXXXXX';
