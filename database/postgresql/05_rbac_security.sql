-- PostgreSQL version of rbac_security.sql
-- Note: PostgreSQL Row Level Security (RLS) is different from SQL Server security policies
-- This is a simplified version that uses RLS

CREATE OR REPLACE FUNCTION sec.fn_order_access(order_id INT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN 
        current_setting('app.current_role', true) IN ('Admin', 'Manager')
        OR (
            current_setting('app.current_role', true) = 'Worker'
            AND EXISTS (
                SELECT 1
                FROM WorkAssignments wa
                WHERE wa.order_id = fn_order_access.order_id
                  AND wa.worker_id = CAST(current_setting('app.worker_id', true) AS INT)
            )
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION sec.fn_assignment_access(worker_id INT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN 
        current_setting('app.current_role', true) IN ('Admin', 'Manager')
        OR (
            current_setting('app.current_role', true) = 'Worker'
            AND fn_assignment_access.worker_id = CAST(current_setting('app.worker_id', true) AS INT)
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE Orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE OrderItems ENABLE ROW LEVEL SECURITY;
ALTER TABLE Measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE Payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE WorkAssignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY worker_order_policy ON Orders
    USING (sec.fn_order_access(id));

CREATE POLICY worker_orderitems_policy ON OrderItems
    USING (sec.fn_order_access(order_id));

CREATE POLICY worker_measurements_policy ON Measurements
    USING (sec.fn_order_access(order_id));

CREATE POLICY worker_payments_policy ON Payments
    USING (sec.fn_order_access(order_id));

CREATE POLICY worker_assignments_policy ON WorkAssignments
    USING (sec.fn_assignment_access(worker_id));

-- Allow admins and managers to bypass RLS
ALTER TABLE Orders FORCE ROW LEVEL SECURITY;
ALTER TABLE OrderItems FORCE ROW LEVEL SECURITY;
ALTER TABLE Measurements FORCE ROW LEVEL SECURITY;
ALTER TABLE Payments FORCE ROW LEVEL SECURITY;
ALTER TABLE WorkAssignments FORCE ROW LEVEL SECURITY;
