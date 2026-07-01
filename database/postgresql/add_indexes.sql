-- PostgreSQL version of add_indexes.sql
-- Database Indexing Optimization for Performance
-- These indexes improve query performance for common operations

-- Users table indexes
CREATE INDEX IF NOT EXISTS IX_Users_username ON Users(username);
CREATE INDEX IF NOT EXISTS IX_Users_role ON Users(role);
CREATE INDEX IF NOT EXISTS IX_Users_is_active ON Users(is_active);
CREATE INDEX IF NOT EXISTS IX_Users_worker_id ON Users(worker_id);

-- Customers table indexes
CREATE INDEX IF NOT EXISTS IX_Customers_name ON Customers(name);
CREATE INDEX IF NOT EXISTS IX_Customers_mobile ON Customers(mobile);

-- CustomerMeasurements table indexes
CREATE INDEX IF NOT EXISTS IX_CustomerMeasurements_customer_id ON CustomerMeasurements(customer_id);

-- Workers table indexes
CREATE INDEX IF NOT EXISTS IX_Workers_name ON Workers(name);
CREATE INDEX IF NOT EXISTS IX_Workers_mobile ON Workers(mobile);
CREATE INDEX IF NOT EXISTS IX_Workers_is_active ON Workers(is_active);

-- Designs table indexes
CREATE INDEX IF NOT EXISTS IX_Designs_name ON Designs(name);
CREATE INDEX IF NOT EXISTS IX_Designs_is_active ON Designs(is_active);

-- Fabrics table indexes
CREATE INDEX IF NOT EXISTS IX_Fabrics_name ON Fabrics(name);
CREATE INDEX IF NOT EXISTS IX_Fabrics_is_active ON Fabrics(is_active);

-- Orders table indexes
CREATE INDEX IF NOT EXISTS IX_Orders_customer_id ON Orders(customer_id);
CREATE INDEX IF NOT EXISTS IX_Orders_order_date ON Orders(order_date);
CREATE INDEX IF NOT EXISTS IX_Orders_delivery_date ON Orders(delivery_date);
CREATE INDEX IF NOT EXISTS IX_Orders_current_stage ON Orders(current_stage);
CREATE INDEX IF NOT EXISTS IX_Orders_status ON Orders(status);
CREATE INDEX IF NOT EXISTS IX_Orders_balance ON Orders(balance);

-- OrderItems table indexes
CREATE INDEX IF NOT EXISTS IX_OrderItems_order_id ON OrderItems(order_id);
CREATE INDEX IF NOT EXISTS IX_OrderItems_fabric_id ON OrderItems(fabric_id);

-- WorkAssignments table indexes
CREATE INDEX IF NOT EXISTS IX_WorkAssignments_order_id ON WorkAssignments(order_id);
CREATE INDEX IF NOT EXISTS IX_WorkAssignments_stage ON WorkAssignments(stage);
CREATE INDEX IF NOT EXISTS IX_WorkAssignments_worker_id ON WorkAssignments(worker_id);

-- Payments table indexes
CREATE INDEX IF NOT EXISTS IX_Payments_order_id ON Payments(order_id);
CREATE INDEX IF NOT EXISTS IX_Payments_payment_date ON Payments(payment_date);

-- WorkerPayments table indexes
CREATE INDEX IF NOT EXISTS IX_WorkerPayments_worker_id ON WorkerPayments(worker_id);
CREATE INDEX IF NOT EXISTS IX_WorkerPayments_payment_date ON WorkerPayments(payment_date);

-- Expenses table indexes
CREATE INDEX IF NOT EXISTS IX_Expenses_expense_date ON Expenses(expense_date);
CREATE INDEX IF NOT EXISTS IX_Expenses_category ON Expenses(category);

-- PasswordResetOTP table indexes
CREATE INDEX IF NOT EXISTS IX_PasswordResetOTP_username ON PasswordResetOTP(username);
CREATE INDEX IF NOT EXISTS IX_PasswordResetOTP_expires_at ON PasswordResetOTP(expires_at);
