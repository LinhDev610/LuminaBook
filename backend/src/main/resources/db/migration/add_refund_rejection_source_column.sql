-- Add column to track who rejected the refund request (CSKH or Staff)
SET @column_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'orders'
      AND COLUMN_NAME = 'refund_rejection_source'
);

SET @ddl := IF(
    @column_exists = 0,
    'ALTER TABLE orders ADD COLUMN refund_rejection_source VARCHAR(50) AFTER refund_rejection_reason',
    'SELECT ''refund_rejection_source already exists'' AS message'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

