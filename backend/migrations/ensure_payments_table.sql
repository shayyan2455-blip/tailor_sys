-- Ensure Payments table exists
CREATE TABLE IF NOT EXISTS Payments (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_type VARCHAR(20) NOT NULL,
    reference VARCHAR(120) NULL,
    notes VARCHAR(500) NULL,
    recorded_by INT NOT NULL,
    CONSTRAINT FK_Payments_order FOREIGN KEY (order_id) REFERENCES Orders(id),
    CONSTRAINT FK_Payments_user FOREIGN KEY (recorded_by) REFERENCES Users(id)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS IX_Payments_order_id ON Payments(order_id);
CREATE INDEX IF NOT EXISTS IX_Payments_payment_date ON Payments(payment_date);
