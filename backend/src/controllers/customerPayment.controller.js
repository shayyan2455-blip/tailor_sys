const { body, validationResult } = require('express-validator');
const { pg, query, transaction } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const rules = [
  body('customer_id').isInt({ min: 1 }).withMessage('Customer is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('payment_type').isIn(['Advance', 'Partial', 'Final']).withMessage('Invalid payment type'),
  body('payment_date').optional().isISO8601().withMessage('Invalid payment date'),
  body('notes').optional().trim()
];

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw httpError(422, 'Validation failed', errors.array());
}

const list = asyncHandler(async (req, res) => {
  const customerId = req.query.customer_id ? Number(req.query.customer_id) : null;

  if (customerId) {
    // If customer_id is specified, return all payments for this customer (both CustomerPayments and Payments)
    const result = await query(req, `
      SELECT
        cp.id,
        cp.customer_id,
        cp.amount,
        cp.payment_date,
        cp.payment_type,
        cp.notes,
        cp.applied_amount,
        cp.recorded_by,
        u.username AS recorded_by_name,
        'CustomerPayment' AS payment_source,
        NULL AS order_id,
        NULL AS order_id_display
      FROM CustomerPayments cp
      INNER JOIN Users u ON u.id = cp.recorded_by
      WHERE cp.customer_id = $1
        AND ($2::date IS NULL OR cp.payment_date >= $2::date)
        AND ($3::date IS NULL OR cp.payment_date <= $3::date)

      UNION ALL

      SELECT
        p.id,
        o.customer_id,
        p.amount,
        p.payment_date,
        p.payment_type,
        p.notes,
        p.amount AS applied_amount,
        p.recorded_by,
        u.username AS recorded_by_name,
        'OrderPayment' AS payment_source,
        p.order_id,
        o.id::text AS order_id_display
      FROM Payments p
      INNER JOIN Orders o ON o.id = p.order_id
      INNER JOIN Users u ON u.id = p.recorded_by
      WHERE o.customer_id = $1
        AND ($2::date IS NULL OR p.payment_date >= $2::date)
        AND ($3::date IS NULL OR p.payment_date <= $3::date)

      ORDER BY payment_date DESC, id DESC
      LIMIT 300;
    `, [customerId, req.query.from || null, req.query.to || null]);
    res.json({ data: result.rows });
  } else {
    // If no customer_id, return only CustomerPayments (for admin view)
    const result = await query(req, `
      SELECT cp.*, c.name AS customer_name, c.mobile, u.username AS recorded_by_name,
             'CustomerPayment' AS payment_source,
             NULL AS order_id,
             NULL AS order_id_display
      FROM CustomerPayments cp
      INNER JOIN Customers c ON c.id = cp.customer_id
      INNER JOIN Users u ON u.id = cp.recorded_by
      WHERE ($1::int IS NULL OR cp.customer_id = $1::int)
        AND ($2::date IS NULL OR cp.payment_date >= $2::date)
        AND ($3::date IS NULL OR cp.payment_date <= $3::date)
      ORDER BY cp.payment_date DESC, cp.id DESC
      LIMIT 300;
    `, [req.query.customer_id ? Number(req.query.customer_id) : null, req.query.from || null, req.query.to || null]);
    res.json({ data: result.rows });
  }
});

const create = asyncHandler(async (req, res) => {
  validate(req);
  const data = await transaction(req, async (run) => {
    // Create customer payment
    const inserted = await run(`
      INSERT INTO CustomerPayments(customer_id, amount, payment_date, payment_type, notes, recorded_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id;
    `, [
      Number(req.body.customer_id),
      Number(req.body.amount),
      req.body.payment_date || new Date().toISOString().split('T')[0],
      req.body.payment_type,
      req.body.notes || null,
      req.session.user.id
    ]);
    const paymentId = inserted.rows[0].id;

    // Get customer's pending orders with balance
    const ordersResult = await run(`
      SELECT id, balance FROM Orders
      WHERE customer_id = $1 AND balance > 0 AND status <> 'Delivered'
      ORDER BY order_date ASC;
    `, [Number(req.body.customer_id)]);

    let remainingAmount = Number(req.body.amount);
    let appliedAmount = 0;

    // Apply payment to orders in chronological order
    for (const order of ordersResult.rows) {
      if (remainingAmount <= 0) break;

      const orderBalance = Number(order.balance);
      const paymentForOrder = Math.min(remainingAmount, orderBalance);

      if (paymentForOrder > 0) {
        // Create payment entry for this order
        await run(`
          INSERT INTO Payments(order_id, amount, payment_date, payment_type, notes, recorded_by)
          VALUES ($1, $2, $3, $4, $5, $6);
        `, [
          order.id,
          paymentForOrder,
          req.body.payment_date || new Date().toISOString().split('T')[0],
          req.body.payment_type,
          `Applied from customer payment #${paymentId}`,
          req.session.user.id
        ]);

        remainingAmount -= paymentForOrder;
        appliedAmount += paymentForOrder;
      }
    }

    // If there's remaining amount, add to customer credit balance
    if (remainingAmount > 0) {
      await run(`
        UPDATE Customers
        SET credit_balance = credit_balance + $1
        WHERE id = $2;
      `, [remainingAmount, Number(req.body.customer_id)]);
      appliedAmount += remainingAmount;
    }

    // Update the customer payment with applied amount
    await run(`
      UPDATE CustomerPayments
      SET applied_amount = $1
      WHERE id = $2;
    `, [appliedAmount, paymentId]);

    const summary = await run('SELECT * FROM CustomerPayments WHERE id = $1;', [paymentId]);
    return summary.rows[0];
  });
  res.status(201).json({ data });
});

module.exports = { rules, list, create };
