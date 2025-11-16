-- ============================================
-- UPDATE PROMOTION STATUS COLUMN
-- ============================================
-- This script fixes the "Data truncated for column 'status'" error
-- by updating the status column to VARCHAR(50) to support new enum values like PENDING_APPROVAL

-- IMPORTANT: 
-- 1. Replace 'lumina_book' with your actual database name if different
-- 2. Run this script in your MySQL database
-- 3. Restart your Spring Boot application after running this script

USE lumina_book;

-- Step 1: Check current column type (for reference)
-- Run this first to see what type the column currently is:
-- SHOW COLUMNS FROM promotions WHERE Field = 'status';

-- Step 2: If the column is ENUM, we need to convert it to VARCHAR
-- This handles both ENUM and VARCHAR cases
-- For MySQL/MariaDB:
ALTER TABLE promotions 
MODIFY COLUMN status VARCHAR(50) NOT NULL;

-- Step 3: (Optional) If you have existing data with old enum values, update them:
-- Uncomment and run these if you have old data that needs migration:
-- UPDATE promotions SET status = 'PENDING_APPROVAL' WHERE status = 'PENDING';
-- UPDATE promotions SET status = 'DISABLED' WHERE status = 'CANCELLED';

-- Step 4: Verify the change
-- Run this to confirm the column is now VARCHAR(50):
-- SHOW COLUMNS FROM promotions WHERE Field = 'status';
-- You should see: Type = varchar(50), Null = NO

-- ============================================
-- ALTERNATIVE: If the above doesn't work, try this:
-- ============================================
-- If you get an error about ENUM, you may need to:
-- 1. First, create a temporary column
-- ALTER TABLE promotions ADD COLUMN status_temp VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL';
-- 
-- 2. Copy data (if any)
-- UPDATE promotions SET status_temp = CAST(status AS CHAR);
-- 
-- 3. Drop old column
-- ALTER TABLE promotions DROP COLUMN status;
-- 
-- 4. Rename new column
-- ALTER TABLE promotions CHANGE COLUMN status_temp status VARCHAR(50) NOT NULL;

