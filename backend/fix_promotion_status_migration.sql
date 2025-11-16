-- ============================================
-- FIX PROMOTION STATUS MIGRATION
-- ============================================
-- This script fixes the "Data truncated for column 'status'" error
-- by first updating existing data, then converting the column type
--
-- IMPORTANT: 
-- 1. Replace 'lumina_book' with your actual database name if different
-- 2. Run this script in your MySQL database BEFORE starting the application
-- 3. Make sure to backup your database before running this script

USE lumina_book;

-- Step 1: Check current data (for reference)
-- Run this first to see what status values exist:
-- SELECT DISTINCT status FROM promotions;

-- Step 2: Disable safe update mode temporarily (for this session only)
-- This allows us to update rows based on non-key columns
SET SQL_SAFE_UPDATES = 0;

-- Step 3: Update any old status values to new enum values
-- This handles migration from old status values to new ones
-- Note: Using LIMIT to ensure we're updating specific rows
UPDATE promotions SET status = 'PENDING_APPROVAL' WHERE status = 'PENDING' LIMIT 1000;
UPDATE promotions SET status = 'APPROVED' WHERE status = 'ACTIVE' LIMIT 1000;
UPDATE promotions SET status = 'APPROVED' WHERE status = 'APPROVE' LIMIT 1000;
UPDATE promotions SET status = 'REJECTED' WHERE status = 'REJECT' LIMIT 1000;
UPDATE promotions SET status = 'REJECTED' WHERE status = 'DENIED' LIMIT 1000;
UPDATE promotions SET status = 'DISABLED' WHERE status = 'CANCELLED' LIMIT 1000;
UPDATE promotions SET status = 'DISABLED' WHERE status = 'CANCEL' LIMIT 1000;
UPDATE promotions SET status = 'DISABLED' WHERE status = 'INACTIVE' LIMIT 1000;

-- Re-enable safe update mode (recommended for safety)
SET SQL_SAFE_UPDATES = 1;

-- Step 4: Convert ENUM column to VARCHAR(50) to support new enum values
-- This is safer than trying to modify the ENUM directly
-- First, check if column is ENUM:
-- SHOW COLUMNS FROM promotions WHERE Field = 'status';

-- If the column is ENUM, convert it to VARCHAR:
ALTER TABLE promotions 
MODIFY COLUMN status VARCHAR(50) NOT NULL;

-- Step 5: Verify the change
-- Run this to confirm the column is now VARCHAR(50):
-- SHOW COLUMNS FROM promotions WHERE Field = 'status';
-- You should see: Type = varchar(50), Null = NO

-- Step 6: Verify data integrity
-- Run this to check all status values are valid:
-- SELECT DISTINCT status FROM promotions;
-- All values should be one of: PENDING_APPROVAL, APPROVED, REJECTED, EXPIRED, DISABLED

