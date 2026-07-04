USE TailorERP;
GO

CREATE OR ALTER PROCEDURE dbo.RecalculateOrderSummary
    @order_id INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @total DECIMAL(12,2) = (
        SELECT COALESCE(SUM(amount), 0) FROM dbo.OrderItems WHERE order_id = @order_id
    );
    DECLARE @paid DECIMAL(12,2) = (
        SELECT COALESCE(SUM(amount), 0) FROM dbo.Payments WHERE order_id = @order_id
    );
    DECLARE @advance DECIMAL(12,2) = (
        SELECT COALESCE(SUM(CASE WHEN payment_type = N'Advance' THEN amount ELSE 0 END), 0)
        FROM dbo.Payments WHERE order_id = @order_id
    );

    UPDATE dbo.Orders
    SET total_amount = @total,
        advance = @advance,
        balance = CASE WHEN @total - @paid > 0 THEN @total - @paid ELSE 0 END
    WHERE id = @order_id;
END;
GO

CREATE OR ALTER PROCEDURE dbo.RecalculateOrderStage
    @order_id INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @stage NVARCHAR(20) = N'Booked';
    IF NOT EXISTS (SELECT 1 FROM dbo.OrderItems WHERE order_id = @order_id) SET @stage = N'Booked';
    ELSE IF NOT EXISTS (SELECT 1 FROM dbo.OrderItems WHERE order_id = @order_id AND stage_delivered = 0) SET @stage = N'Delivered';
    ELSE IF NOT EXISTS (SELECT 1 FROM dbo.OrderItems WHERE order_id = @order_id AND stage_ready = 0) SET @stage = N'Ready';
    ELSE IF NOT EXISTS (SELECT 1 FROM dbo.OrderItems WHERE order_id = @order_id AND stage_stitching = 0) SET @stage = N'Stitching';
    ELSE IF NOT EXISTS (SELECT 1 FROM dbo.OrderItems WHERE order_id = @order_id AND stage_cutting = 0) SET @stage = N'Cutting';

    UPDATE dbo.Orders
    SET current_stage = @stage,
        status = CASE WHEN @stage = N'Delivered' THEN N'Delivered'
                      WHEN @stage = N'Ready' THEN N'Ready'
                      ELSE status END
    WHERE id = @order_id AND status <> N'Cancelled';
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_OrderItems_Summary
ON dbo.OrderItems
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @orders TABLE (id INT PRIMARY KEY);
    INSERT INTO @orders(id)
    SELECT DISTINCT order_id FROM inserted
    UNION
    SELECT DISTINCT order_id FROM deleted;

    DECLARE @id INT;
    DECLARE cur CURSOR LOCAL FAST_FORWARD FOR SELECT id FROM @orders;
    OPEN cur;
    FETCH NEXT FROM cur INTO @id;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        EXEC dbo.RecalculateOrderSummary @id;
        EXEC dbo.RecalculateOrderStage @id;
        FETCH NEXT FROM cur INTO @id;
    END
    CLOSE cur;
    DEALLOCATE cur;
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_Payments_Summary
ON dbo.Payments
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @orders TABLE (id INT PRIMARY KEY);
    INSERT INTO @orders(id)
    SELECT DISTINCT order_id FROM inserted
    UNION
    SELECT DISTINCT order_id FROM deleted;

    DECLARE @id INT;
    DECLARE cur CURSOR LOCAL FAST_FORWARD FOR SELECT id FROM @orders;
    OPEN cur;
    FETCH NEXT FROM cur INTO @id;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        EXEC dbo.RecalculateOrderSummary @id;
        FETCH NEXT FROM cur INTO @id;
    END
    CLOSE cur;
    DEALLOCATE cur;
END;
GO
