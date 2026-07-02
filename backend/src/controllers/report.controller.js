const { pg, query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

function dateParams(req) {
  return {
    from: req.query.from || null,
    to: req.query.to || null
  };
}

async function orderReport(req, stage, status) {
  return query(req, `
    SELECT o.id, o.order_date, o.delivery_date, o.total_amount, o.balance,
           o.current_stage, o.status, c.name AS customer_name, c.mobile
    FROM Orders o INNER JOIN Customers c ON c.id = o.customer_id
    WHERE ($1 IS NULL OR o.current_stage = $1)
      AND ($2 IS NULL OR o.status = $2)
      AND ($3 IS NULL OR o.order_date >= $3)
      AND ($4 IS NULL OR o.order_date <= $4)
    ORDER BY o.delivery_date, o.id;
  `, [stage, status, req.query.from || null, req.query.to || null]);
}

const pendingOrders = asyncHandler(async (req, res) => {
  const result = await orderReport(req, null, 'Open');
  res.json({ data: result.rows });
});

const readyOrders = asyncHandler(async (req, res) => {
  const result = await orderReport(req, 'Ready', null);
  res.json({ data: result.rows });
});

const deliveredOrders = asyncHandler(async (req, res) => {
  const result = await orderReport(req, null, 'Delivered');
  res.json({ data: result.rows });
});

const recovery = asyncHandler(async (req, res) => {
  try {
    const result = await query(req, `
      SELECT o.id, o.order_date, o.delivery_date, o.total_amount, o.advance, o.balance,
             c.name AS customer_name, c.mobile
      FROM Orders o INNER JOIN Customers c ON c.id = o.customer_id
      WHERE o.balance > 0
        AND ($1 IS NULL OR o.order_date >= $1)
        AND ($2 IS NULL OR o.order_date <= $2)
      ORDER BY o.balance DESC, o.delivery_date;
    `, [req.query.from || null, req.query.to || null]);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Recovery report error:', error);
    throw error;
  }
});

const workerLedger = asyncHandler(async (req, res) => {
  try {
    const result = await query(req, `
      SELECT w.id AS worker_id, w.name AS worker_name,
             COALESCE(SUM(we.amount), 0) AS total_earnings,
             COALESCE(SUM(wp.amount), 0) AS total_paid,
             COALESCE(SUM(we.amount), 0) - COALESCE(SUM(wp.amount), 0) AS balance
      FROM Workers w
      LEFT JOIN WorkerEarnings we ON we.worker_id = w.id
        AND ($1 IS NULL OR we.earned_at >= $1)
        AND ($2 IS NULL OR we.earned_at <= $2)
      LEFT JOIN WorkerPayments wp ON wp.worker_id = w.id
        AND ($1 IS NULL OR wp.payment_date >= $1)
        AND ($2 IS NULL OR wp.payment_date <= $2)
      WHERE ($3 IS NULL OR w.id = $3)
      GROUP BY w.id, w.name
      ORDER BY w.name;
    `, [req.query.from || null, req.query.to || null, req.query.worker_id ? Number(req.query.worker_id) : null]);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Worker ledger error:', error);
    throw error;
  }
});

const profit = asyncHandler(async (req, res) => {
  try {
    const result = await query(req, `
      SELECT 'Income' AS label, COALESCE(SUM(amount), 0) AS amount
      FROM Payments
      WHERE ($1 IS NULL OR payment_date >= $1) AND ($2 IS NULL OR payment_date <= $2)
      UNION ALL
      SELECT 'Expense' AS label, COALESCE(SUM(cost), 0) AS amount
      FROM Expenses
      WHERE ($1 IS NULL OR expense_date >= $1) AND ($2 IS NULL OR expense_date <= $2)
      UNION ALL
      SELECT 'Worker Payments' AS label, COALESCE(SUM(amount), 0) AS amount
      FROM WorkerPayments
      WHERE ($1 IS NULL OR payment_date >= $1) AND ($2 IS NULL OR payment_date <= $2);
    `, [req.query.from || null, req.query.to || null]);
    const income = result.rows.find((row) => row.label === 'Income')?.amount || 0;
    const expense = result.rows.find((row) => row.label === 'Expense')?.amount || 0;
    const workerPayments = result.rows.find((row) => row.label === 'Worker Payments')?.amount || 0;
    res.json({ data: { bars: result.rows, net: Number(income) - Number(expense) - Number(workerPayments) } });
  } catch (error) {
    console.error('Profit report error:', error);
    throw error;
  }
});

const dashboardStats = asyncHandler(async (req, res) => {
  // Supplier balance (money owed to suppliers from expenses)
  const supplierResult = await query(req, `
    SELECT COALESCE(SUM(cost), 0) AS total_owed,
           COALESCE(SUM(paid_amount), 0) AS total_paid,
           COALESCE(SUM(balance), 0) AS total_balance
    FROM Expenses;
  `);
  
  // Customer owed and paid
  const customerResult = await query(req, `
    SELECT COALESCE(SUM(total_amount), 0) AS total_owed,
           COALESCE(SUM(balance), 0) AS balance_owed
    FROM Orders;
  `);
  
  // Worker owed
  const workerResult = await query(req, `
    SELECT COALESCE(SUM(amount), 0) AS total_owed
    FROM WorkerEarnings;
  `);
  
  const workerPaidResult = await query(req, `
    SELECT COALESCE(SUM(amount), 0) AS total_paid
    FROM WorkerPayments;
  `);
  
  res.json({
    data: {
      supplier_total_owed: supplierResult.rows[0]?.total_owed || 0,
      supplier_paid: supplierResult.rows[0]?.total_paid || 0,
      supplier_balance: supplierResult.rows[0]?.total_balance || 0,
      customer_total_owed: customerResult.rows[0]?.total_owed || 0,
      customer_balance_owed: customerResult.rows[0]?.balance_owed || 0,
      customer_paid: (customerResult.rows[0]?.total_owed || 0) - (customerResult.rows[0]?.balance_owed || 0),
      worker_total_owed: workerResult.rows[0]?.total_owed || 0,
      worker_paid: workerPaidResult.rows[0]?.total_paid || 0,
      worker_balance: (workerResult.rows[0]?.total_owed || 0) - (workerPaidResult.rows[0]?.total_paid || 0)
    }
  });
});

module.exports = {
  pendingOrders,
  readyOrders,
  deliveredOrders,
  recovery,
  workerLedger,
  profit,
  dashboardStats
};
