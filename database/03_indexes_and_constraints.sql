USE TailorERP;
GO

ALTER TABLE dbo.Users
    ADD CONSTRAINT FK_Users_Workers FOREIGN KEY (worker_id) REFERENCES dbo.Workers(id);
GO

ALTER TABLE dbo.Orders
    ADD CONSTRAINT FK_Orders_Customers FOREIGN KEY (customer_id) REFERENCES dbo.Customers(id),
        CONSTRAINT FK_Orders_Users_created_by FOREIGN KEY (created_by) REFERENCES dbo.Users(id),
        CONSTRAINT CK_Orders_stage CHECK (current_stage IN (N'Booked',N'Cutting',N'Stitching',N'Ready',N'Delivered')),
        CONSTRAINT CK_Orders_status CHECK (status IN (N'Open',N'Ready',N'Delivered',N'Cancelled')),
        CONSTRAINT CK_Orders_money CHECK (total_amount >= 0 AND advance >= 0 AND balance >= 0);
GO

ALTER TABLE dbo.OrderItems
    ADD CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (order_id) REFERENCES dbo.Orders(id) ON DELETE CASCADE,
        CONSTRAINT FK_OrderItems_Fabrics FOREIGN KEY (fabric_id) REFERENCES dbo.Fabrics(id),
        CONSTRAINT CK_OrderItems_qty_rate CHECK (qty > 0 AND rate >= 0);
GO

ALTER TABLE dbo.Measurements
    ADD CONSTRAINT FK_Measurements_Orders FOREIGN KEY (order_id) REFERENCES dbo.Orders(id) ON DELETE CASCADE,
        CONSTRAINT UQ_Measurements_order UNIQUE (order_id);
GO

ALTER TABLE dbo.Payments
    ADD CONSTRAINT FK_Payments_Orders FOREIGN KEY (order_id) REFERENCES dbo.Orders(id),
        CONSTRAINT FK_Payments_Users_recorded_by FOREIGN KEY (recorded_by) REFERENCES dbo.Users(id),
        CONSTRAINT CK_Payments_amount CHECK (amount > 0),
        CONSTRAINT CK_Payments_type CHECK (payment_type IN (N'Advance',N'Partial',N'Final'));
GO

ALTER TABLE dbo.Expenses
    ADD CONSTRAINT FK_Expenses_Users_recorded_by FOREIGN KEY (recorded_by) REFERENCES dbo.Users(id),
        CONSTRAINT CK_Expenses_cost CHECK (cost >= 0),
        CONSTRAINT CK_Expenses_paid_amount CHECK (paid_amount >= 0);
GO

ALTER TABLE dbo.WorkAssignments
    ADD CONSTRAINT FK_WorkAssignments_Orders FOREIGN KEY (order_id) REFERENCES dbo.Orders(id) ON DELETE CASCADE,
        CONSTRAINT FK_WorkAssignments_Workers FOREIGN KEY (worker_id) REFERENCES dbo.Workers(id),
        CONSTRAINT CK_WorkAssignments_stage CHECK (stage IN (N'Booked',N'Cutting',N'Stitching',N'Ready',N'Delivered'));
GO

CREATE INDEX IX_Customers_mobile ON dbo.Customers(mobile);
CREATE INDEX IX_Customers_name ON dbo.Customers(name);
CREATE INDEX IX_Orders_order_date ON dbo.Orders(order_date);
CREATE INDEX IX_Orders_current_stage ON dbo.Orders(current_stage);
CREATE INDEX IX_Orders_status ON dbo.Orders(status);
CREATE INDEX IX_OrderItems_order_id ON dbo.OrderItems(order_id);
CREATE INDEX IX_Payments_order_id ON dbo.Payments(order_id);
CREATE INDEX IX_WorkAssignments_worker_id ON dbo.WorkAssignments(worker_id);
CREATE INDEX IX_WorkAssignments_order_id ON dbo.WorkAssignments(order_id);
CREATE UNIQUE INDEX UX_WorkAssignments_order_worker_stage_active ON dbo.WorkAssignments(order_id, worker_id, stage) WHERE completed_at IS NULL;
GO
