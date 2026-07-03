-- Fix ambiguous column references in order calculation functions

-- Drop existing functions first
DROP FUNCTION IF EXISTS RecalculateOrderSummary(integer);
DROP FUNCTION IF EXISTS RecalculateOrderStage(integer);

-- Recreate functions with renamed parameters
CREATE FUNCTION RecalculateOrderSummary(p_order_id INT)
RETURNS VOID AS $$
BEGIN
    UPDATE Orders
    SET 
        total_amount = COALESCE((SELECT SUM(amount) FROM OrderItems WHERE order_id = Orders.id), 0),
        advance = COALESCE((SELECT SUM(CASE WHEN payment_type = 'Advance' THEN amount ELSE 0 END) FROM Payments WHERE order_id = Orders.id), 0),
        balance = GREATEST(0, COALESCE((SELECT SUM(amount) FROM OrderItems WHERE order_id = Orders.id), 0) - COALESCE((SELECT SUM(amount) FROM Payments WHERE order_id = Orders.id), 0))
    WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION RecalculateOrderStage(p_order_id INT)
RETURNS VOID AS $$
DECLARE
    stage VARCHAR(20) := 'Booked';
BEGIN
    IF NOT EXISTS (SELECT 1 FROM OrderItems WHERE order_id = p_order_id) THEN
        stage := 'Booked';
    ELSIF NOT EXISTS (SELECT 1 FROM OrderItems WHERE order_id = p_order_id AND stage_delivered = false) THEN
        stage := 'Delivered';
    ELSIF NOT EXISTS (SELECT 1 FROM OrderItems WHERE order_id = p_order_id AND stage_ready = false) THEN
        stage := 'Ready';
    ELSIF NOT EXISTS (SELECT 1 FROM OrderItems WHERE order_id = p_order_id AND stage_pressing = false) THEN
        stage := 'Pressing';
    ELSIF NOT EXISTS (SELECT 1 FROM OrderItems WHERE order_id = p_order_id AND stage_alteration = false) THEN
        stage := 'Alteration';
    ELSIF NOT EXISTS (SELECT 1 FROM OrderItems WHERE order_id = p_order_id AND stage_trial = false) THEN
        stage := 'Trial';
    ELSIF NOT EXISTS (SELECT 1 FROM OrderItems WHERE order_id = p_order_id AND stage_stitching = false) THEN
        stage := 'Stitching';
    ELSIF NOT EXISTS (SELECT 1 FROM OrderItems WHERE order_id = p_order_id AND stage_cutting = false) THEN
        stage := 'Cutting';
    END IF;

    UPDATE Orders
    SET 
        current_stage = stage,
        status = CASE 
            WHEN stage = 'Delivered' THEN 'Delivered'
            WHEN stage = 'Ready' THEN 'Ready'
            ELSE status 
        END
    WHERE id = p_order_id AND status <> 'Cancelled';
END;
$$ LANGUAGE plpgsql;
