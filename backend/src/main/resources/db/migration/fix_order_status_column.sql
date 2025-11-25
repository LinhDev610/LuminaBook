-- Fix order status column to support new return/refund status values
-- IMPORTANT: Run this script to allow storing longer status values like RETURN_REQUESTED, RETURN_REJECTED, REFUNDED
-- Step 1: Temporarily disable safe update mode for bulk updates
SET SQL_SAFE_UPDATES = 0;

-- Step 2: Alter status column to VARCHAR(50) to support all enum values
-- This allows storing values like RETURN_REQUESTED (15 chars), RETURN_REJECTED (15 chars), REFUNDED (8 chars)
ALTER TABLE orders 
MODIFY COLUMN status VARCHAR(50) 
DEFAULT NULL;

-- Step 3: Re-enable safe update mode
SET SQL_SAFE_UPDATES = 1;

-- Step 4: Verify the fix (optional - uncomment to check)
-- SELECT id, code, status FROM orders WHERE status LIKE 'RETURN%' OR status = 'REFUNDED' LIMIT 10;

