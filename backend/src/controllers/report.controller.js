const { pg, query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

function dateParams(req) {
  return {
    from: req.query.from || null,
    to: req.query.to || null
  };
}

async function orderReport(req, stage, status) {
  const result = await query(req, `
    SELECT o.id, o.order_date, o.delivery_date, o.total_amount, o.balance,
           o.current_stage, o.status, c.name AS customer_name, c.mobile
    FROM Orders o INNER JOIN Customers c ON c.id = o.customer_id
    WHERE ($1::text IS NULL OR o.current_stage = $1::text)
      AND ($2::text IS NULL OR o.status = $2::text)
      AND ($3::date IS NULL OR o.order_date >= $3::date)
      AND ($4::date IS NULL OR o.order_date <= $4::date)
    ORDER BY o.delivery_date, o.id;
  `, [stage, status, req.query.from || null, req.query.to || null]);

  // If no orders, return empty array
  if (result.rows.length === 0) {
    return result;
  }

  // Get worker assignments for these orders
  const orderIds = result.rows.map(o => o.id);
  const assignmentsResult = await query(req, `
    WITH ranked_assignments AS (
      SELECT 
        wa.order_id, 
        wa.stage, 
        wa.completed_at, 
        w.name AS worker_name, 
        wa.worker_id AS assignment_worker_id,
        ROW_NUMBER() OVER (PARTITION BY wa.order_id ORDER BY 
          CASE 
            WHEN wa.stage = o.current_stage THEN 0
            WHEN wa.completed_at IS NOT NULL THEN 1
            ELSE 2
          END,
          wa.completed_at DESC NULLS LAST,
          wa.assigned_at DESC
        ) AS rn
      FROM WorkAssignments wa
      LEFT JOIN Workers w ON w.id = wa.worker_id
      INNER JOIN Orders o ON o.id = wa.order_id
      WHERE wa.order_id = ANY($1)
    )
    SELECT order_id, stage, worker_name, assignment_worker_id
    FROM ranked_assignments
    WHERE rn = 1;
  `, [orderIds]);

  // Create a map for quick lookup
  const assignmentsMap = {};
  assignmentsResult.rows.forEach(row => {
    assignmentsMap[row.order_id] = row;
  });

  // Add assignment info to each order
  result.rows = result.rows.map(order => ({
    ...order,
    assigned_stage: assignmentsMap[order.id]?.stage || null,
    worker_name: assignmentsMap[order.id]?.worker_name || null
  }));

  return result;
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
    const cursor = Number(req.query.cursor) || 0;
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    
    const result = await query(req, `
      SELECT o.id, o.customer_id, o.order_date, o.delivery_date, o.total_amount, o.advance, o.balance,
             c.name AS customer_name, c.mobile, c.credit_balance
      FROM Orders o INNER JOIN Customers c ON c.id = o.customer_id
      WHERE o.balance > 0
        AND o.status <> 'Delivered'
        AND ($1::date IS NULL OR o.order_date >= $1::date)
        AND ($2::date IS NULL OR o.order_date <= $2::date)
        AND o.id > $3
      ORDER BY o.id
      LIMIT $4;
    `, [req.query.from || null, req.query.to || null, cursor, limit]);

    // Also include customers with credit balance (they owe money from previous deliveries)
    const creditResult = await query(req, `
      SELECT NULL AS id, c.id AS customer_id, NULL AS order_date, NULL AS delivery_date, 0 AS total_amount, 0 AS advance,
             c.credit_balance AS balance, c.name AS customer_name, c.mobile, c.credit_balance
      FROM Customers c
      WHERE c.credit_balance > 0
        AND c.id > $1
      ORDER BY c.id
      LIMIT $2;
    `, [cursor, limit]);

    // Combine both results
    const combinedData = [...result.rows, ...creditResult.rows];
    const nextCursor = combinedData.length > 0 ? Math.max(...combinedData.filter(r => r.id).map(r => r.id)) : null;
    
    res.json({ 
      data: combinedData,
      pagination: {
        nextCursor,
        hasMore: combinedData.length === limit
      }
    });
  } catch (error) {
    console.error('Recovery report error:', error);
    throw error;
  }
});

const workerLedger = asyncHandler(async (req, res) => {
  try {
    const result = await query(req, `
      SELECT 
        w.id AS worker_id,
        w.name AS worker_name,
        COALESCE((SELECT SUM(amount) FROM WorkerEarnings WHERE worker_id = w.id), 0) AS total_earnings,
        COALESCE((SELECT SUM(amount) FROM WorkerPayments WHERE worker_id = w.id), 0) AS total_paid,
        COALESCE((SELECT SUM(amount) FROM WorkerEarnings WHERE worker_id = w.id), 0) - COALESCE((SELECT SUM(amount) FROM WorkerPayments WHERE worker_id = w.id), 0) AS balance
      FROM Workers w
      WHERE ($1::int IS NULL OR w.id = $1::int)
      ORDER BY w.name;
    `, [req.query.worker_id ? Number(req.query.worker_id) : null]);
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
      WHERE ($1::date IS NULL OR payment_date >= $1::date) AND ($2::date IS NULL OR payment_date <= $2::date)
      UNION ALL
      SELECT 'Expense' AS label, COALESCE(SUM(total_paid), 0) AS amount
      FROM Expenses
      WHERE ($1::date IS NULL OR expense_date >= $1::date) AND ($2::date IS NULL OR expense_date <= $2::date)
      UNION ALL
      SELECT 'Worker Payments' AS label, COALESCE(SUM(amount), 0) AS amount
      FROM WorkerPayments
      WHERE ($1::date IS NULL OR payment_date >= $1::date) AND ($2::date IS NULL OR payment_date <= $2::date);
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
