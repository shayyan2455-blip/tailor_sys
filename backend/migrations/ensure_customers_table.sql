-- Ensure Customers table exists
CREATE TABLE IF NOT EXISTS Customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    mobile VARCHAR(30) NOT NULL,
    address VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS IX_Customers_name ON Customers(name);
CREATE INDEX IF NOT EXISTS IX_Customers_mobile ON Customers(mobile);
