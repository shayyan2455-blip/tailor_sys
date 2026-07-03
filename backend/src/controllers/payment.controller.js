const { body, validationResult } = require('express-validator');
const { pg, query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const rules = [
  body('order_id').isInt({ min: 1 }),
  body('amount').isFloat({ min: 0.01 }),
  body('payment_date').isISO8601(),
  body('payment_type').isIn(['Advance', 'Partial', 'Final']),
  body('reference').optional({ nullable: true }).trim().isLength({ max: 120 }),
  body('notes').optional({ nullable: true }).trim().isLength({ max: 500 })
];

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw httpError(422, 'Validation failed', errors.array());
}

const list = asyncHandler(async (req, res) => {
  const result = await query(req, `
    SELECT p.*, u.username AS recorded_by_name
    FROM Payments p INNER JOIN Users u ON u.id = p.recorded_by
    WHERE ($1::int IS NULL OR p.order_id = $1::int)
    ORDER BY p.payment_date DESC, p.id DESC;
  `, [req.query.order_id ? Number(req.query.order_id) : null]);
  res.json({ data: result.rows });
});

const create = asyncHandler(async (req, res) => {
  validate(req);
  const result = await query(req, `
    INSERT INTO Payments(order_id, amount, payment_date, payment_type, reference, notes, recorded_by)
    VALUES($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `, [
    Number(req.body.order_id),
    Number(req.body.amount),
    req.body.payment_date,
    req.body.payment_type,
    req.body.reference || null,
    req.body.notes || null,
    req.session.user.id
  ]);
  res.status(201).json({ data: result.rows[0] });
});

module.exports = { rules, list, create };
