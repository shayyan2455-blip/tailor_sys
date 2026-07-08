-- Add ExpensePayments table to track payments against expenses
CREATE TABLE ExpensePayments (
    id SERIAL PRIMARY KEY,
    expense_id INT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_type VARCHAR(20) NOT NULL,
    notes VARCHAR(500) NULL,
    recorded_by INT NOT NULL,
    CONSTRAINT FK_ExpensePayments_Expenses FOREIGN KEY (expense_id) REFERENCES Expenses(id) ON DELETE CASCADE,
    CONSTRAINT FK_ExpensePayments_Users FOREIGN KEY (recorded_by) REFERENCES Users(id)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS IX_ExpensePayments_expense_id ON ExpensePayments(expense_id);
CREATE INDEX IF NOT EXISTS IX_ExpensePayments_payment_date ON ExpensePayments(payment_date);

-- Update Expenses table to track total paid amount via payments
ALTER TABLE Expenses ADD COLUMN IF NOT EXISTS total_paid NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Create trigger to update total_paid when payments are added/updated/deleted
CREATE OR REPLACE FUNCTION update_expense_total_paid()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE Expenses 
        SET total_paid = COALESCE(total_paid, 0) + NEW.amount,
            balance = cost - (COALESCE(total_paid, 0) + NEW.amount)
        WHERE id = NEW.expense_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE Expenses 
        SET total_paid = COALESCE(total_paid, 0) - OLD.amount + NEW.amount,
            balance = cost - (COALESCE(total_paid, 0) - OLD.amount + NEW.amount)
        WHERE id = NEW.expense_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE Expenses 
        SET total_paid = COALESCE(total_paid, 0) - OLD.amount,
            balance = cost - (COALESCE(total_paid, 0) - OLD.amount)
        WHERE id = OLD.expense_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_expense_total_paid ON ExpensePayments;
CREATE TRIGGER trigger_update_expense_total_paid
    AFTER INSERT OR UPDATE OR DELETE ON ExpensePayments
    FOR EACH ROW EXECUTE FUNCTION update_expense_total_paid();

-- Initialize total_paid for existing expenses (set to paid_amount)
UPDATE Expenses 
SET total_paid = COALESCE(paid_amount, 0),
    balance = cost - COALESCE(paid_amount, 0)
WHERE total_paid = 0;
