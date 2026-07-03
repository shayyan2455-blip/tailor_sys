-- Ensure Designs table exists
CREATE TABLE IF NOT EXISTS Designs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(500) NULL,
    default_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS IX_Designs_name ON Designs(name);
CREATE INDEX IF NOT EXISTS IX_Designs_is_active ON Designs(is_active);
