USE TailorERP;
GO
-- Create archive tables for data archiving strategy
-- These tables store old/completed records to keep main tables performant

CREATE TABLE dbo.Orders_Archive (
  id INT PRIMARY KEY,
  customer_id INT NOT NULL,
  order_date DATETIME NOT NULL,
  delivery_date DATETIME NULL,
  current_stage NVARCHAR(50) NULL,
  status NVARCHAR(20) NULL,
  total_amount DECIMAL(18,2) NULL,
  paid_amount DECIMAL(18,2) NULL,
  balance DECIMAL(18,2) NULL,
  notes NVARCHAR(MAX) NULL,
  archived_at DATETIME DEFAULT GETDATE(),
  INDEX IX_Orders_Archive_customer_id (customer_id),
  INDEX IX_Orders_Archive_order_date (order_date),
  INDEX IX_Orders_Archive_archived_at (archived_at)
);

CREATE TABLE dbo.Payments_Archive (
  id INT PRIMARY KEY,
  order_id INT NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  payment_date DATETIME NOT NULL,
  payment_method NVARCHAR(50) NULL,
  notes NVARCHAR(MAX) NULL,
  archived_at DATETIME DEFAULT GETDATE(),
  INDEX IX_Payments_Archive_order_id (order_id),
  INDEX IX_Payments_Archive_payment_date (payment_date),
  INDEX IX_Payments_Archive_archived_at (archived_at)
);

CREATE TABLE dbo.Expenses_Archive (
  id INT PRIMARY KEY,
  description NVARCHAR(255) NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  expense_date DATETIME NOT NULL,
  category NVARCHAR(100) NULL,
  notes NVARCHAR(MAX) NULL,
  archived_at DATETIME DEFAULT GETDATE(),
  INDEX IX_Expenses_Archive_expense_date (expense_date),
  INDEX IX_Expenses_Archive_category (category),
  INDEX IX_Expenses_Archive_archived_at (archived_at)
);

CREATE TABLE dbo.ProductionStages_Archive (
  id INT PRIMARY KEY,
  order_id INT NOT NULL,
  stage_name NVARCHAR(100) NOT NULL,
  status NVARCHAR(20) NOT NULL,
  worker_id INT NULL,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  archived_at DATETIME DEFAULT GETDATE(),
  INDEX IX_ProductionStages_Archive_order_id (order_id),
  INDEX IX_ProductionStages_Archive_archived_at (archived_at)
);
