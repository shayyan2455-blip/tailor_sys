-- Ensure CustomerMeasurements table exists for customer default measurements
CREATE TABLE IF NOT EXISTS CustomerMeasurements (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL,
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
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT UQ_CustomerMeasurements_customer UNIQUE (customer_id),
  CONSTRAINT FK_CustomerMeasurements_customer FOREIGN KEY (customer_id) REFERENCES Customers(id) ON DELETE CASCADE
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS IX_CustomerMeasurements_customer_id ON CustomerMeasurements(customer_id);
