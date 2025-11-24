-- Change note column from VARCHAR to TEXT to support longer return request notes
ALTER TABLE orders MODIFY COLUMN note TEXT;

