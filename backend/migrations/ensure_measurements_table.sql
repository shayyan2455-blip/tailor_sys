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
  CONSTRAINT UQ_Measurements_order UNIQUE (order_id),
  CONSTRAINT FK_Measurements_order FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE
);

-- Add unique constraint if table already exists without it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uq_measurements_order' 
    AND conrelid = 'measurements'::regclass
  ) THEN
    ALTER TABLE Measurements ADD CONSTRAINT UQ_Measurements_order UNIQUE (order_id);
  END IF;
END $$;

-- Add foreign key constraint if table already exists without it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_measurements_order' 
    AND conrelid = 'measurements'::regclass
  ) THEN
    ALTER TABLE Measurements ADD CONSTRAINT FK_Measurements_order FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS IX_Measurements_order_id ON Measurements(order_id);
