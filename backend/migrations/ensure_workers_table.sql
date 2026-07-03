-- Ensure Workers table exists with default_stage column
CREATE TABLE IF NOT EXISTS Workers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    mobile VARCHAR(30) NULL,
    wage_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
    default_stage VARCHAR(20) NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT CK_Workers_default_stage CHECK (default_stage IS NULL OR default_stage IN ('Booked', 'Cutting', 'Stitching', 'Trial', 'Alteration', 'Pressing', 'Ready', 'Delivered'))
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS IX_Workers_name ON Workers(name);
CREATE INDEX IF NOT EXISTS IX_Workers_mobile ON Workers(mobile);
CREATE INDEX IF NOT EXISTS IX_Workers_is_active ON Workers(is_active);
