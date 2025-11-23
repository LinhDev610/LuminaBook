-- Add refund/return request fields to orders table
-- This migration adds columns to store refund request information separately from the note field

ALTER TABLE orders 
ADD COLUMN refund_reason_type VARCHAR(50) DEFAULT NULL,
ADD COLUMN refund_description TEXT DEFAULT NULL,
ADD COLUMN refund_email VARCHAR(255) DEFAULT NULL,
ADD COLUMN refund_return_address TEXT DEFAULT NULL,
ADD COLUMN refund_method VARCHAR(100) DEFAULT NULL,
ADD COLUMN refund_bank VARCHAR(100) DEFAULT NULL,
ADD COLUMN refund_account_number VARCHAR(50) DEFAULT NULL,
ADD COLUMN refund_account_holder VARCHAR(255) DEFAULT NULL,
ADD COLUMN refund_amount DECIMAL(15, 2) DEFAULT NULL,
ADD COLUMN refund_return_fee DECIMAL(15, 2) DEFAULT NULL,
ADD COLUMN refund_selected_product_ids TEXT DEFAULT NULL,
ADD COLUMN refund_media_urls TEXT DEFAULT NULL;

-- Add index for refund status queries
CREATE INDEX idx_orders_refund_status ON orders(status) WHERE status IN ('RETURN_REQUESTED', 'REFUNDED', 'RETURN_REJECTED');

