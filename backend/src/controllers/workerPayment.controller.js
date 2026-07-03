const { body, validationResult } = require('express-validator');
const { pg, query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const rules = [
  body('worker_id').isInt({ min: 1 }),
  body('amount').isFloat({ min: 0.01 }),
  body('payment_date').isISO8601()
];

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw httpError(422, 'Validation failed', errors.array());
}

const list = asyncHandler(async (req, res) => {
  const result = await query(req, `
    SELECT wp.*, w.name AS worker_name, u.username AS recorded_by_name
    FROM WorkerPayments wp
    INNER JOIN Workers w ON w.id = wp.worker_id
    INNER JOIN Users u ON u.id = wp.recorded_by
    WHERE ($1::int IS NULL OR wp.worker_id = $1::int)
      AND ($2::date IS NULL OR wp.payment_date >= $2::date)
      AND ($3::date IS NULL OR wp.payment_date <= $3::date)
    ORDER BY wp.payment_date DESC, wp.id DESC;
  `, [req.query.worker_id ? Number(req.query.worker_id) : null, req.query.from || null, req.query.to || null]);
  res.json({ data: result.rows });
});

const create = asyncHandler(async (req, res) => {
  validate(req);
  const result = await query(req, `
    INSERT INTO WorkerPayments(worker_id, amount, payment_date, notes, recorded_by)
    VALUES($1, $2, $3, $4, $5)
    RETURNING *;
  `, [
    Number(req.body.worker_id),
    Number(req.body.amount),
    req.body.payment_date,
    req.body.notes || null,
    req.session.user.id
  ]);
  res.status(201).json({ data: result.rows[0] });
});

const remove = asyncHandler(async (req, res) => {
  const result = await query(req, 'DELETE FROM WorkerPayments WHERE id=$1 RETURNING id;', [Number(req.params.id)]);
  if (!result.rows[0]) throw httpError(404, 'Payment not found');
  res.json({ data: { id: result.rows[0].id } });
});

const workerBalance = asyncHandler(async (req, res) => {
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
});

module.exports = { rules, list, create, remove, workerBalance };
