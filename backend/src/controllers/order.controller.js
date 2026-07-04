const { body, validationResult } = require('express-validator');
const { pg, query, transaction } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const measurementFields = ['neck', 'chest', 'waist', 'hip', 'shoulder', 'sleeve', 'length', 'collar', 'shalwar_len', 'pancha'];

const rules = [
  body('customer_id').isInt({ min: 1 }).withMessage('Customer is required'),
  body('order_date').isISO8601().withMessage('Order date is required'),
  body('delivery_date').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body('items').isArray({ min: 1 }).withMessage('At least one order item is required'),
  body('items.*.garment_type').trim().notEmpty().withMessage('Garment type is required'),
  body('items.*.qty').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.rate').isFloat({ min: 0 }).withMessage('Rate must be zero or greater'),
  body('advance').optional().isFloat({ min: 0 })
];

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation errors:', errors.array());
    console.error('Request body:', req.body);
    throw httpError(422, 'Validation failed', errors.array());
  }
}

function itemParams(item, orderId, index) {
  return {
    [`order_id_${index}`]: orderId,
    [`garment_type_${index}`]: item.garment_type,
    [`qty_${index}`]: Number(item.qty),
    [`rate_${index}`]: Number(item.rate),
    [`fabric_id_${index}`]: item.fabric_id || null,
    [`remarks_${index}`]: item.remarks || null
  };
}

async function insertItems(run, orderId, items) {
  for (let index = 0; index < items.length; index += 1) {
    await run(`
      INSERT INTO OrderItems(order_id, garment_type, qty, rate, fabric_id, remarks, stage_booked_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW());
    `, [
      orderId,
      items[index].garment_type,
      Number(items[index].qty),
      Number(items[index].rate),
      items[index].fabric_id || null,
      items[index].remarks || null
    ]);
  }
}

function measurementParams(orderId, measurements = {}) {
  const params = [orderId];
  for (const field of measurementFields) {
    params.push(measurements[field] === '' || measurements[field] == null ? null : Number(measurements[field]));
  }
  return params;
}

async function upsertMeasurement(run, orderId, measurements) {
  const params = measurementParams(orderId, measurements);
  const fields = measurementFields.join(', ');
  const placeholders = measurementFields.map((_, i) => `$${i + 2}`).join(', ');
  const updateFields = measurementFields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  
  await run(`
    INSERT INTO Measurements(order_id, ${fields})
    VALUES ($1, ${placeholders})
    ON CONFLICT (order_id) DO UPDATE SET ${updateFields};
  `, params);
}

const list = asyncHandler(async (req, res) => {
  const result = await query(req, `
    SELECT o.id, o.order_date, o.delivery_date, o.total_amount, o.advance, o.balance,
           o.current_stage, o.status, c.name AS customer_name, c.mobile
    FROM Orders o
    INNER JOIN Customers c ON c.id = o.customer_id
    WHERE ($1::text IS NULL OR o.status = $1::text)
      AND ($2::text IS NULL OR o.current_stage = $2::text)
      AND ($3::date IS NULL OR o.order_date >= $3::date)
      AND ($4::date IS NULL OR o.order_date <= $4::date)
    ORDER BY o.order_date DESC, o.id DESC
    LIMIT 300;
  `, [req.query.status || null, req.query.stage || null, req.query.from || null, req.query.to || null]);
  res.json({ data: result.rows });
});

const deliveryList = asyncHandler(async (req, res) => {
  const result = await query(req, `
    SELECT o.id, o.order_date, o.delivery_date, o.total_amount, o.advance, o.balance,
           o.current_stage, o.status, c.name AS customer_name, c.mobile, c.address
    FROM Orders o
    INNER JOIN Customers c ON c.id = o.customer_id
    WHERE o.current_stage = 'Delivered'
      AND o.status <> 'Delivered'
    ORDER BY o.delivery_date, o.id
    LIMIT 300;
  `, []);
  res.json({ data: result.rows });
});

const detail = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const orderResult = await query(req, `
    SELECT o.*, c.name AS customer_name, c.mobile, c.address
    FROM Orders o INNER JOIN Customers c ON c.id = o.customer_id
    WHERE o.id = $1;
  `, [id]);
  const itemsResult = await query(req, `
    SELECT oi.*, f.name AS fabric_name
    FROM OrderItems oi LEFT JOIN Fabrics f ON f.id = oi.fabric_id
    WHERE oi.order_id = $1 ORDER BY oi.id;
  `, [id]);
  const measurementsResult = await query(req, `SELECT * FROM Measurements WHERE order_id = $1;`, [id]);
  const paymentsResult = await query(req, `
    SELECT p.*, u.username AS recorded_by_name
    FROM Payments p INNER JOIN Users u ON u.id = p.recorded_by
    WHERE p.order_id = $1 ORDER BY p.payment_date, p.id;
  `, [id]);
  if (!orderResult.rows[0]) throw httpError(404, 'Order not found');
  res.json({
    data: {
      order: orderResult.rows[0],
      items: itemsResult.rows,
      measurements: measurementsResult.rows[0] || null,
      payments: paymentsResult.rows
    }
  });
});

const create = asyncHandler(async (req, res) => {
  validate(req);
  const data = await transaction(req, async (run) => {
    // Get customer's credit balance and unapplied customer payments
    const customer = await run('SELECT credit_balance FROM Customers WHERE id = $1;', [Number(req.body.customer_id)]);
    const customerCredit = Number(customer.rows[0]?.credit_balance || 0);

    const unappliedPayments = await run(`
      SELECT id, amount, applied_amount FROM CustomerPayments
      WHERE customer_id = $1 AND amount > applied_amount
      ORDER BY payment_date ASC;
    `, [Number(req.body.customer_id)]);

    const totalUnapplied = unappliedPayments.rows.reduce((sum, p) => sum + (Number(p.amount) - Number(p.applied_amount)), 0);
    const totalAdvance = Number(req.body.advance || 0) + customerCredit + totalUnapplied;

    const inserted = await run(`
      INSERT INTO Orders(customer_id, order_date, delivery_date, notes, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
    `, [Number(req.body.customer_id), req.body.order_date, req.body.delivery_date || null, req.body.notes || null, req.session.user.id]);
    const orderId = inserted.rows[0].id;
    await insertItems(run, orderId, req.body.items);
    await upsertMeasurement(run, orderId, req.body.measurements || {});

    // Auto-assign workers based on their default_stage
    const workersWithDefaultStage = await run(`
      SELECT id, default_stage FROM Workers
      WHERE default_stage IS NOT NULL AND is_active = true;
    `);

    for (const worker of workersWithDefaultStage.rows) {
      await run(`
        INSERT INTO WorkAssignments(order_id, worker_id, stage)
        VALUES($1, $2, $3);
      `, [orderId, worker.id, worker.default_stage]);
    }

    // Record payments
    if (Number(req.body.advance || 0) > 0) {
      await run(`
        INSERT INTO Payments(order_id, amount, payment_date, payment_type, reference, notes, recorded_by)
        VALUES($1, $2, $3, 'Advance', $4, $5, $6);
      `, [orderId, Number(req.body.advance), req.body.order_date, req.body.advance_reference || null, 'Order advance', req.session.user.id]);
    }

    // If customer has credit balance, record it as a payment and clear the credit
    if (customerCredit > 0) {
      await run(`
        INSERT INTO Payments(order_id, amount, payment_date, payment_type, notes, recorded_by)
        VALUES($1, $2, $3, 'Advance', $4, $5);
      `, [orderId, customerCredit, req.body.order_date, 'Applied from customer credit balance', req.session.user.id]);

      await run(`
        UPDATE Customers
        SET credit_balance = 0
        WHERE id = $1;
      `, [Number(req.body.customer_id)]);
    }

    // Apply unapplied customer payments to this order
    for (const payment of unappliedPayments.rows) {
      const unappliedAmount = Number(payment.amount) - Number(payment.applied_amount);
      if (unappliedAmount > 0) {
        await run(`
          INSERT INTO Payments(order_id, amount, payment_date, payment_type, notes, recorded_by)
          VALUES($1, $2, $3, 'Advance', $4, $5);
        `, [orderId, unappliedAmount, req.body.order_date, `Applied from customer payment #${payment.id}`, req.session.user.id]);

        await run(`
          UPDATE CustomerPayments
          SET applied_amount = applied_amount + $1
          WHERE id = $2;
        `, [unappliedAmount, payment.id]);
      }
    }

    const summary = await run('SELECT * FROM Orders WHERE id = $1;', [orderId]);
    return summary.rows[0];
  });
  res.status(201).json({ data });
});

const update = asyncHandler(async (req, res) => {
  validate(req);
  const orderId = Number(req.params.id);
  const data = await transaction(req, async (run) => {
    const updated = await run(`
      UPDATE Orders
      SET customer_id=$1, order_date=$2, delivery_date=$3, notes=$4
      WHERE id=$5
      RETURNING id;
    `, [Number(req.body.customer_id), req.body.order_date, req.body.delivery_date || null, req.body.notes || null, orderId]);
    if (!updated.rows[0]) throw httpError(404, 'Order not found');
    await run('DELETE FROM OrderItems WHERE order_id=$1;', [orderId]);
    await insertItems(run, orderId, req.body.items);
    await upsertMeasurement(run, orderId, req.body.measurements || {});
    const summary = await run('SELECT * FROM Orders WHERE id = $1;', [orderId]);
    return summary.rows[0];
  });
  res.json({ data });
});

module.exports = { rules, list, detail, create, update, deliveryList };
