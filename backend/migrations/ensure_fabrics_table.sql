-- Ensure Fabrics table exists
CREATE TABLE IF NOT EXISTS Fabrics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    cost_per_unit NUMERIC(12,2) NOT NULL DEFAULT 0,
    supplier VARCHAR(160) NULL,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS IX_Fabrics_name ON Fabrics(name);
CREATE INDEX IF NOT EXISTS IX_Fabrics_is_active ON Fabrics(is_active);
