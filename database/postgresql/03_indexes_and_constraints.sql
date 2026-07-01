-- PostgreSQL version of indexes_and_constraints.sql

ALTER TABLE Users
    ADD CONSTRAINT FK_Users_Workers FOREIGN KEY (worker_id) REFERENCES Workers(id);

ALTER TABLE Orders
    ADD CONSTRAINT FK_Orders_Customers FOREIGN KEY (customer_id) REFERENCES Customers(id),
        CONSTRAINT FK_Orders_Users_created_by FOREIGN KEY (created_by) REFERENCES Users(id),
        CONSTRAINT CK_Orders_stage CHECK (current_stage IN ('Booked','Cutting','Stitching','Trial','Alteration','Pressing','Ready','Delivered')),
        CONSTRAINT CK_Orders_status CHECK (status IN ('Open','Ready','Delivered','Cancelled')),
        CONSTRAINT CK_Orders_money CHECK (total_amount >= 0 AND advance >= 0 AND balance >= 0);

ALTER TABLE OrderItems
    ADD CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE,
        CONSTRAINT FK_OrderItems_Fabrics FOREIGN KEY (fabric_id) REFERENCES Fabrics(id),
        CONSTRAINT CK_OrderItems_qty_rate CHECK (qty > 0 AND rate >= 0);

ALTER TABLE Measurements
    ADD CONSTRAINT FK_Measurements_Orders FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE,
        CONSTRAINT UQ_Measurements_order UNIQUE (order_id);

ALTER TABLE Payments
    ADD CONSTRAINT FK_Payments_Orders FOREIGN KEY (order_id) REFERENCES Orders(id),
        CONSTRAINT FK_Payments_Users_recorded_by FOREIGN KEY (recorded_by) REFERENCES Users(id),
        CONSTRAINT CK_Payments_amount CHECK (amount > 0),
        CONSTRAINT CK_Payments_type CHECK (payment_type IN ('Advance','Partial','Final'));

ALTER TABLE Expenses
    ADD CONSTRAINT FK_Expenses_Users_recorded_by FOREIGN KEY (recorded_by) REFERENCES Users(id),
        CONSTRAINT CK_Expenses_cost CHECK (cost >= 0),
        CONSTRAINT CK_Expenses_paid_amount CHECK (paid_amount >= 0);

ALTER TABLE WorkAssignments
    ADD CONSTRAINT FK_WorkAssignments_Orders FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE,
        CONSTRAINT FK_WorkAssignments_Workers FOREIGN KEY (worker_id) REFERENCES Workers(id),
        CONSTRAINT CK_WorkAssignments_stage CHECK (stage IN ('Booked','Cutting','Stitching','Trial','Alteration','Pressing','Ready','Delivered'));

CREATE INDEX IX_Customers_mobile ON Customers(mobile);
CREATE INDEX IX_Customers_name ON Customers(name);
CREATE INDEX IX_Orders_order_date ON Orders(order_date);
CREATE INDEX IX_Orders_current_stage ON Orders(current_stage);
CREATE INDEX IX_Orders_status ON Orders(status);
CREATE INDEX IX_OrderItems_order_id ON OrderItems(order_id);
CREATE INDEX IX_Payments_order_id ON Payments(order_id);
CREATE INDEX IX_WorkAssignments_worker_id ON WorkAssignments(worker_id);
CREATE INDEX IX_WorkAssignments_order_id ON WorkAssignments(order_id);

-- PostgreSQL partial index equivalent to filtered index
CREATE UNIQUE INDEX UX_WorkAssignments_order_worker_stage_active ON WorkAssignments(order_id, worker_id, stage) WHERE completed_at IS NULL;
