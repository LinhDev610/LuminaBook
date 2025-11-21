-- Fix payment_status column to support all enum values
-- IMPORTANT: Run this script BEFORE starting the backend to avoid Hibernate DDL errors
-- Step 1: Temporarily disable safe update mode for bulk updates
SET SQL_SAFE_UPDATES = 0;

-- Step 2: First, fix all invalid payment_status values BEFORE altering the column
-- Update NULL or empty values
UPDATE orders 
SET payment_status = CASE 
    WHEN is_paid = 1 OR is_paid = TRUE THEN 'PAID'
    ELSE 'PENDING'
END
WHERE payment_status IS NULL OR payment_status = '' OR payment_status = 'null';

-- Step 3: Clean up any invalid payment_status values (not in enum list)
-- Set invalid values to PENDING as default
UPDATE orders 
SET payment_status = 'PENDING'
WHERE payment_status NOT IN ('INIT', 'PENDING', 'PAID', 'FAILED', 'CANCELLED')
  AND payment_status IS NOT NULL;

-- Step 4: Now alter payment_status to VARCHAR(20) to be flexible
-- This allows Hibernate to work with the column without ENUM constraints
ALTER TABLE orders 
MODIFY COLUMN payment_status VARCHAR(20) 
DEFAULT NULL;

-- Step 5: Also ensure payment_method column is large enough
ALTER TABLE orders 
MODIFY COLUMN payment_method VARCHAR(20) 
DEFAULT NULL;

-- Step 6: Re-enable safe update mode
SET SQL_SAFE_UPDATES = 1;

-- Step 7: Verify the fix (optional - uncomment to check)
-- SELECT id, code, payment_status, payment_method, is_paid FROM orders LIMIT 10;

