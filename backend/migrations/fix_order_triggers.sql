-- Fix ambiguous column references in order calculation functions

-- Drop existing triggers
DROP TRIGGER IF EXISTS trg_OrderItems_Summary ON OrderItems;
DROP TRIGGER IF EXISTS trg_Payments_Summary ON Payments;

-- Drop existing trigger functions
DROP FUNCTION IF EXISTS trg_OrderItems_Summary();
DROP FUNCTION IF EXISTS trg_Payments_Summary();

-- Drop existing calculation functions
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

-- Recreate trigger functions
CREATE FUNCTION trg_OrderItems_Summary()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM RecalculateOrderSummary(NEW.order_id);
        PERFORM RecalculateOrderStage(NEW.order_id);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM RecalculateOrderSummary(NEW.order_id);
        PERFORM RecalculateOrderStage(NEW.order_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM RecalculateOrderSummary(OLD.order_id);
        PERFORM RecalculateOrderStage(OLD.order_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION trg_Payments_Summary()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM RecalculateOrderSummary(NEW.order_id);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM RecalculateOrderSummary(NEW.order_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM RecalculateOrderSummary(OLD.order_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers
CREATE TRIGGER trg_OrderItems_Summary
AFTER INSERT OR UPDATE OR DELETE ON OrderItems
FOR EACH ROW EXECUTE FUNCTION trg_OrderItems_Summary();

CREATE TRIGGER trg_Payments_Summary
AFTER INSERT OR UPDATE OR DELETE ON Payments
FOR EACH ROW EXECUTE FUNCTION trg_Payments_Summary();
