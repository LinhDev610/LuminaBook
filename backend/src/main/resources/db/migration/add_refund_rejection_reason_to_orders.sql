-- Add refund_rejection_reason column to orders table
-- This column stores the specific reason for refund rejection provided by CSKH staff

ALTER TABLE orders 
ADD COLUMN refund_rejection_reason TEXT DEFAULT NULL;

