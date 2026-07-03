-- Ensure OrderItems table exists
CREATE TABLE IF NOT EXISTS OrderItems (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    garment_type VARCHAR(100) NOT NULL,
    qty INT NOT NULL,
    rate NUMERIC(12,2) NOT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    fabric_id INT NULL,
    remarks VARCHAR(500) NULL,
    stage_booked BOOLEAN NOT NULL DEFAULT true,
    stage_booked_at TIMESTAMP NULL,
    stage_cutting BOOLEAN NOT NULL DEFAULT false,
    stage_cutting_at TIMESTAMP NULL,
    stage_stitching BOOLEAN NOT NULL DEFAULT false,
    stage_stitching_at TIMESTAMP NULL,
    stage_trial BOOLEAN NOT NULL DEFAULT false,
    stage_trial_at TIMESTAMP NULL,
    stage_alteration BOOLEAN NOT NULL DEFAULT false,
    stage_alteration_at TIMESTAMP NULL,
    stage_pressing BOOLEAN NOT NULL DEFAULT false,
    stage_pressing_at TIMESTAMP NULL,
    stage_ready BOOLEAN NOT NULL DEFAULT false,
    stage_ready_at TIMESTAMP NULL,
    stage_delivered BOOLEAN NOT NULL DEFAULT false,
    stage_delivered_at TIMESTAMP NULL,
    CONSTRAINT FK_OrderItems_order FOREIGN KEY (order_id) REFERENCES Orders(id),
    CONSTRAINT FK_OrderItems_fabric FOREIGN KEY (fabric_id) REFERENCES Fabrics(id)
);

-- Add foreign key constraints if table already exists without them
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_orderitems_order' 
    AND conrelid = 'orderitems'::regclass
  ) THEN
    ALTER TABLE OrderItems ADD CONSTRAINT FK_OrderItems_order FOREIGN KEY (order_id) REFERENCES Orders(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_orderitems_fabric' 
    AND conrelid = 'orderitems'::regclass
  ) THEN
    ALTER TABLE OrderItems ADD CONSTRAINT FK_OrderItems_fabric FOREIGN KEY (fabric_id) REFERENCES Fabrics(id);
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS IX_OrderItems_order_id ON OrderItems(order_id);
CREATE INDEX IF NOT EXISTS IX_OrderItems_fabric_id ON OrderItems(fabric_id);
