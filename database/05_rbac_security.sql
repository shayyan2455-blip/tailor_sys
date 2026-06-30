USE TailorERP;
GO

CREATE OR ALTER FUNCTION sec.fn_order_access(@order_id INT)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN
    SELECT 1 AS fn_access_result
    WHERE CAST(SESSION_CONTEXT(N'role') AS NVARCHAR(20)) IN (N'Admin', N'Manager')
       OR (
            CAST(SESSION_CONTEXT(N'role') AS NVARCHAR(20)) = N'Worker'
            AND EXISTS (
                SELECT 1
                FROM dbo.WorkAssignments wa
                WHERE wa.order_id = @order_id
                  AND wa.worker_id = TRY_CAST(SESSION_CONTEXT(N'worker_id') AS INT)
            )
       );
GO

CREATE OR ALTER FUNCTION sec.fn_assignment_access(@worker_id INT)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN
    SELECT 1 AS fn_access_result
    WHERE CAST(SESSION_CONTEXT(N'role') AS NVARCHAR(20)) IN (N'Admin', N'Manager')
       OR (
            CAST(SESSION_CONTEXT(N'role') AS NVARCHAR(20)) = N'Worker'
            AND @worker_id = TRY_CAST(SESSION_CONTEXT(N'worker_id') AS INT)
       );
GO

CREATE SECURITY POLICY sec.WorkerOrderPolicy
ADD FILTER PREDICATE sec.fn_order_access(id) ON dbo.Orders,
ADD FILTER PREDICATE sec.fn_order_access(order_id) ON dbo.OrderItems,
ADD FILTER PREDICATE sec.fn_order_access(order_id) ON dbo.Measurements,
ADD FILTER PREDICATE sec.fn_order_access(order_id) ON dbo.Payments,
ADD FILTER PREDICATE sec.fn_assignment_access(worker_id) ON dbo.WorkAssignments
WITH (STATE = ON);
GO
