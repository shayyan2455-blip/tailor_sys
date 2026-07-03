-- Ensure Measurements table exists for order-specific measurements
CREATE TABLE IF NOT EXISTS Measurements (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL,
  neck NUMERIC(6,2) NULL,
  chest NUMERIC(6,2) NULL,
  waist NUMERIC(6,2) NULL,
  hip NUMERIC(6,2) NULL,
  shoulder NUMERIC(6,2) NULL,
  sleeve NUMERIC(6,2) NULL,
  length NUMERIC(6,2) NULL,
  collar NUMERIC(6,2) NULL,
  shalwar_len NUMERIC(6,2) NULL,
  pancha NUMERIC(6,2) NULL,
  CONSTRAINT FK_Measurements_order FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS IX_Measurements_order_id ON Measurements(order_id);
