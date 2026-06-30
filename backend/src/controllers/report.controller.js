const { sql, query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

function dateParams(req) {
  return {
    from: { type: sql.Date, value: req.query.from || null },
    to: { type: sql.Date, value: req.query.to || null }
  };
}

async function orderReport(req, stage, status) {
  return query(req, `
    SELECT o.id, o.order_date, o.delivery_date, o.total_amount, o.balance,
           o.current_stage, o.status, c.name AS customer_name, c.mobile
    FROM dbo.Orders o INNER JOIN dbo.Customers c ON c.id = o.customer_id
    WHERE (@stage IS NULL OR o.current_stage = @stage)
      AND (@status IS NULL OR o.status = @status)
      AND (@from IS NULL OR o.order_date >= @from)
      AND (@to IS NULL OR o.order_date <= @to)
    ORDER BY o.delivery_date, o.id;
  `, {
    ...dateParams(req),
    stage: { type: sql.NVarChar(20), value: stage },
    status: { type: sql.NVarChar(20), value: status }
  });
}

const pendingOrders = asyncHandler(async (req, res) => {
  const result = await orderReport(req, null, 'Open');
  res.json({ data: result.recordset });
});

const readyOrders = asyncHandler(async (req, res) => {
  const result = await orderReport(req, 'Ready', null);
  res.json({ data: result.recordset });
});

const deliveredOrders = asyncHandler(async (req, res) => {
  const result = await orderReport(req, null, 'Delivered');
  res.json({ data: result.recordset });
});

const recovery = asyncHandler(async (req, res) => {
  const result = await query(req, `
    SELECT o.id, o.order_date, o.delivery_date, o.total_amount, o.advance, o.balance,
           c.name AS customer_name, c.mobile
    FROM dbo.Orders o INNER JOIN dbo.Customers c ON c.id = o.customer_id
    WHERE o.balance > 0
      AND (@from IS NULL OR o.order_date >= @from)
      AND (@to IS NULL OR o.order_date <= @to)
    ORDER BY o.balance DESC, o.delivery_date;
  `, dateParams(req));
  res.json({ data: result.recordset });
});

const workerLedger = asyncHandler(async (req, res) => {
  const result = await query(req, `
    SELECT w.id AS worker_id, w.name AS worker_name, wa.stage,
           COUNT(*) AS assigned_count,
           SUM(CASE WHEN wa.completed_at IS NOT NULL THEN 1 ELSE 0 END) AS completed_count,
           SUM(w.wage_rate) AS estimated_wages
    FROM dbo.WorkAssignments wa
    INNER JOIN dbo.Workers w ON w.id = wa.worker_id
    WHERE (@worker_id IS NULL OR wa.worker_id = @worker_id)
      AND (@from IS NULL OR CAST(wa.assigned_at AS date) >= @from)
      AND (@to IS NULL OR CAST(wa.assigned_at AS date) <= @to)
    GROUP BY w.id, w.name, wa.stage
    ORDER BY w.name, wa.stage;
  `, {
    ...dateParams(req),
    worker_id: { type: sql.Int, value: req.query.worker_id ? Number(req.query.worker_id) : null }
  });
  res.json({ data: result.recordset });
});

const profit = asyncHandler(async (req, res) => {
  const result = await query(req, `
    SELECT 'Income' AS label, COALESCE(SUM(amount), 0) AS amount
    FROM dbo.Payments
    WHERE (@from IS NULL OR payment_date >= @from) AND (@to IS NULL OR payment_date <= @to)
    UNION ALL
    SELECT 'Expense' AS label, COALESCE(SUM(amount), 0) AS amount
    FROM dbo.Expenses
    WHERE (@from IS NULL OR expense_date >= @from) AND (@to IS NULL OR expense_date <= @to);
  `, dateParams(req));
  const income = result.recordset.find((row) => row.label === 'Income')?.amount || 0;
  const expense = result.recordset.find((row) => row.label === 'Expense')?.amount || 0;
  res.json({ data: { bars: result.recordset, net: Number(income) - Number(expense) } });
});

module.exports = {
  pendingOrders,
  readyOrders,
  deliveredOrders,
  recovery,
  workerLedger,
  profit
};
