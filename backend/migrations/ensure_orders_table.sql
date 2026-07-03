-- Ensure Orders table exists
CREATE TABLE IF NOT EXISTS Orders (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    delivery_date DATE NULL,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    advance NUMERIC(12,2) NOT NULL DEFAULT 0,
    balance NUMERIC(12,2) NOT NULL DEFAULT 0,
    current_stage VARCHAR(20) NOT NULL DEFAULT 'Booked',
    status VARCHAR(20) NOT NULL DEFAULT 'Open',
    notes VARCHAR(1000) NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT FK_Orders_customer FOREIGN KEY (customer_id) REFERENCES Customers(id),
    CONSTRAINT FK_Orders_user FOREIGN KEY (created_by) REFERENCES Users(id)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS IX_Orders_customer_id ON Orders(customer_id);
CREATE INDEX IF NOT EXISTS IX_Orders_order_date ON Orders(order_date);
CREATE INDEX IF NOT EXISTS IX_Orders_delivery_date ON Orders(delivery_date);
CREATE INDEX IF NOT EXISTS IX_Orders_current_stage ON Orders(current_stage);
CREATE INDEX IF NOT EXISTS IX_Orders_status ON Orders(status);
CREATE INDEX IF NOT EXISTS IX_Orders_balance ON Orders(balance);
