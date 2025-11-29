ALTER TABLE orders
    ADD COLUMN refund_second_shipping_fee DOUBLE;

ALTER TABLE orders
    ADD COLUMN refund_penalty_amount DOUBLE;

ALTER TABLE orders
    ADD COLUMN refund_total_paid DOUBLE;

ALTER TABLE orders
    ADD COLUMN refund_confirmed_amount DOUBLE;

ALTER TABLE orders
    ADD COLUMN refund_confirmed_penalty DOUBLE;

ALTER TABLE orders
    ADD COLUMN refund_confirmed_second_shipping_fee DOUBLE;

