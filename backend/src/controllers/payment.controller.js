const { body, validationResult } = require('express-validator');
const { sql, query } = require('../config/db');
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
    FROM dbo.Payments p INNER JOIN dbo.Users u ON u.id = p.recorded_by
    WHERE (@order_id IS NULL OR p.order_id = @order_id)
    ORDER BY p.payment_date DESC, p.id DESC;
  `, { order_id: { type: sql.Int, value: req.query.order_id ? Number(req.query.order_id) : null } });
  res.json({ data: result.recordset });
});

const create = asyncHandler(async (req, res) => {
  validate(req);
  const result = await query(req, `
    INSERT INTO dbo.Payments(order_id, amount, payment_date, payment_type, reference, notes, recorded_by)
    OUTPUT inserted.*
    VALUES(@order_id, @amount, @payment_date, @payment_type, @reference, @notes, @recorded_by);
  `, {
    order_id: { type: sql.Int, value: Number(req.body.order_id) },
    amount: { type: sql.Decimal(12, 2), value: Number(req.body.amount) },
    payment_date: { type: sql.Date, value: req.body.payment_date },
    payment_type: { type: sql.NVarChar(20), value: req.body.payment_type },
    reference: { type: sql.NVarChar(120), value: req.body.reference || null },
    notes: { type: sql.NVarChar(500), value: req.body.notes || null },
    recorded_by: { type: sql.Int, value: req.session.user.id }
  });
  res.status(201).json({ data: result.recordset[0] });
});

module.exports = { rules, list, create };
