-- Store the date when staff confirms they received the return package
ALTER TABLE orders
    ADD COLUMN return_checked_date DATE DEFAULT NULL;

