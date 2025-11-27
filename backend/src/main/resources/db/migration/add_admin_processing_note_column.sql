-- Add column to store admin-specific processing notes, separate from customer notes
SET @column_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'orders'
      AND COLUMN_NAME = 'admin_processing_note'
);

SET @ddl := IF(
    @column_exists = 0,
    'ALTER TABLE orders ADD COLUMN admin_processing_note TEXT AFTER staff_inspection_result',
    'SELECT ''admin_processing_note already exists'' AS message'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

