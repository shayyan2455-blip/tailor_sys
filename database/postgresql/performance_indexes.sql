-- Performance Optimization Indexes for 3000+ Users
-- Run this SQL file against your database to add composite indexes

-- Composite indexes for Orders table (most critical)
CREATE INDEX IF NOT EXISTS IX_Orders_customer_status ON Orders(customer_id, status);
CREATE INDEX IF NOT EXISTS IX_Orders_stage_status ON Orders(current_stage, status);
CREATE INDEX IF NOT EXISTS IX_Orders_delivery_status ON Orders(delivery_date, status);
CREATE INDEX IF NOT EXISTS IX_Orders_balance_positive ON Orders(balance) WHERE balance > 0;

-- Composite indexes for WorkAssignments
CREATE INDEX IF NOT EXISTS IX_WorkAssignments_order_stage_active ON WorkAssignments(order_id, stage) WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS IX_WorkAssignments_worker_stage ON WorkAssignments(worker_id, stage);
CREATE INDEX IF NOT EXISTS IX_WorkAssignments_order_completed ON WorkAssignments(order_id, completed_at) WHERE completed_at IS NOT NULL;

-- Composite indexes for Payments
CREATE INDEX IF NOT EXISTS IX_Payments_order_date ON Payments(order_id, payment_date);
CREATE INDEX IF NOT EXISTS IX_Payments_order_type ON Payments(order_id, payment_type);

-- Composite indexes for CustomerPayments
CREATE INDEX IF NOT EXISTS IX_CustomerPayments_customer_date ON CustomerPayments(customer_id, payment_date);
CREATE INDEX IF NOT EXISTS IX_CustomerPayments_customer_unapplied ON CustomerPayments(customer_id) WHERE amount > applied_amount;

-- Composite indexes for WorkerEarnings
CREATE INDEX IF NOT EXISTS IX_WorkerEarnings_worker_order ON WorkerEarnings(worker_id, order_id);
CREATE INDEX IF NOT EXISTS IX_WorkerEarnings_worker_stage ON WorkerEarnings(worker_id, stage);

-- Composite indexes for WorkerPayments
CREATE INDEX IF NOT EXISTS IX_WorkerPayments_worker_date ON WorkerPayments(worker_id, payment_date);

-- Composite indexes for OrderItems
CREATE INDEX IF NOT EXISTS IX_OrderItems_order_stage ON OrderItems(order_id, stage_booked, stage_cutting, stage_stitching, stage_ready, stage_delivered);
