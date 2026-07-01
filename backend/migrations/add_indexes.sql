USE TailorERP;
GO
-- Database Indexing Optimization for Performance
-- These indexes improve query performance for common operations

-- Users table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_username' AND object_id = OBJECT_ID('dbo.Users'))
  CREATE INDEX IX_Users_username ON dbo.Users(username);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_role' AND object_id = OBJECT_ID('dbo.Users'))
  CREATE INDEX IX_Users_role ON dbo.Users(role);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_is_active' AND object_id = OBJECT_ID('dbo.Users'))
  CREATE INDEX IX_Users_is_active ON dbo.Users(is_active);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_worker_id' AND object_id = OBJECT_ID('dbo.Users'))
  CREATE INDEX IX_Users_worker_id ON dbo.Users(worker_id);

-- Customers table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_name' AND object_id = OBJECT_ID('dbo.Customers'))
  CREATE INDEX IX_Customers_name ON dbo.Customers(name);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_mobile' AND object_id = OBJECT_ID('dbo.Customers'))
  CREATE INDEX IX_Customers_mobile ON dbo.Customers(mobile);

-- CustomerMeasurements table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CustomerMeasurements_customer_id' AND object_id = OBJECT_ID('dbo.CustomerMeasurements'))
  CREATE INDEX IX_CustomerMeasurements_customer_id ON dbo.CustomerMeasurements(customer_id);

-- Workers table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Workers_name' AND object_id = OBJECT_ID('dbo.Workers'))
  CREATE INDEX IX_Workers_name ON dbo.Workers(name);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Workers_mobile' AND object_id = OBJECT_ID('dbo.Workers'))
  CREATE INDEX IX_Workers_mobile ON dbo.Workers(mobile);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Workers_is_active' AND object_id = OBJECT_ID('dbo.Workers'))
  CREATE INDEX IX_Workers_is_active ON dbo.Workers(is_active);

-- Designs table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Designs_name' AND object_id = OBJECT_ID('dbo.Designs'))
  CREATE INDEX IX_Designs_name ON dbo.Designs(name);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Designs_is_active' AND object_id = OBJECT_ID('dbo.Designs'))
  CREATE INDEX IX_Designs_is_active ON dbo.Designs(is_active);

-- Fabrics table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Fabrics_name' AND object_id = OBJECT_ID('dbo.Fabrics'))
  CREATE INDEX IX_Fabrics_name ON dbo.Fabrics(name);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Fabrics_is_active' AND object_id = OBJECT_ID('dbo.Fabrics'))
  CREATE INDEX IX_Fabrics_is_active ON dbo.Fabrics(is_active);

-- Orders table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_customer_id' AND object_id = OBJECT_ID('dbo.Orders'))
  CREATE INDEX IX_Orders_customer_id ON dbo.Orders(customer_id);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_order_date' AND object_id = OBJECT_ID('dbo.Orders'))
  CREATE INDEX IX_Orders_order_date ON dbo.Orders(order_date);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_delivery_date' AND object_id = OBJECT_ID('dbo.Orders'))
  CREATE INDEX IX_Orders_delivery_date ON dbo.Orders(delivery_date);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_current_stage' AND object_id = OBJECT_ID('dbo.Orders'))
  CREATE INDEX IX_Orders_current_stage ON dbo.Orders(current_stage);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_status' AND object_id = OBJECT_ID('dbo.Orders'))
  CREATE INDEX IX_Orders_status ON dbo.Orders(status);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_balance' AND object_id = OBJECT_ID('dbo.Orders'))
  CREATE INDEX IX_Orders_balance ON dbo.Orders(balance);

-- OrderItems table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_OrderItems_order_id' AND object_id = OBJECT_ID('dbo.OrderItems'))
  CREATE INDEX IX_OrderItems_order_id ON dbo.OrderItems(order_id);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_OrderItems_fabric_id' AND object_id = OBJECT_ID('dbo.OrderItems'))
  CREATE INDEX IX_OrderItems_fabric_id ON dbo.OrderItems(fabric_id);

-- WorkAssignments table indexes (not ProductionStages)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_WorkAssignments_order_id' AND object_id = OBJECT_ID('dbo.WorkAssignments'))
  CREATE INDEX IX_WorkAssignments_order_id ON dbo.WorkAssignments(order_id);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_WorkAssignments_stage' AND object_id = OBJECT_ID('dbo.WorkAssignments'))
  CREATE INDEX IX_WorkAssignments_stage ON dbo.WorkAssignments(stage);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_WorkAssignments_worker_id' AND object_id = OBJECT_ID('dbo.WorkAssignments'))
  CREATE INDEX IX_WorkAssignments_worker_id ON dbo.WorkAssignments(worker_id);

-- Payments table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Payments_order_id' AND object_id = OBJECT_ID('dbo.Payments'))
  CREATE INDEX IX_Payments_order_id ON dbo.Payments(order_id);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Payments_payment_date' AND object_id = OBJECT_ID('dbo.Payments'))
  CREATE INDEX IX_Payments_payment_date ON dbo.Payments(payment_date);

-- WorkerPayments table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_WorkerPayments_worker_id' AND object_id = OBJECT_ID('dbo.WorkerPayments'))
  CREATE INDEX IX_WorkerPayments_worker_id ON dbo.WorkerPayments(worker_id);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_WorkerPayments_payment_date' AND object_id = OBJECT_ID('dbo.WorkerPayments'))
  CREATE INDEX IX_WorkerPayments_payment_date ON dbo.WorkerPayments(payment_date);

-- Expenses table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Expenses_expense_date' AND object_id = OBJECT_ID('dbo.Expenses'))
  CREATE INDEX IX_Expenses_expense_date ON dbo.Expenses(expense_date);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Expenses_category' AND object_id = OBJECT_ID('dbo.Expenses'))
  CREATE INDEX IX_Expenses_category ON dbo.Expenses(category);

-- PasswordResetOTP table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PasswordResetOTP_username' AND object_id = OBJECT_ID('dbo.PasswordResetOTP'))
  CREATE INDEX IX_PasswordResetOTP_username ON dbo.PasswordResetOTP(username);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PasswordResetOTP_expires_at' AND object_id = OBJECT_ID('dbo.PasswordResetOTP'))
  CREATE INDEX IX_PasswordResetOTP_expires_at ON dbo.PasswordResetOTP(expires_at);
