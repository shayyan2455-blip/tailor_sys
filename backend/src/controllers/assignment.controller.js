const { body, validationResult } = require('express-validator');
const { pg, query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const rules = [
  body('order_id').isInt({ min: 1 }),
  body('worker_id').isInt({ min: 1 }),
  body('stage').isIn(['Booked', 'Cutting', 'Stitching', 'Trial', 'Alteration', 'Pressing', 'Ready', 'Delivered'])
];

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw httpError(422, 'Validation failed', errors.array());
}

const list = asyncHandler(async (req, res) => {
  const result = await query(req, `
    SELECT wa.*, w.name AS worker_name, c.name AS customer_name, o.delivery_date
    FROM WorkAssignments wa
    INNER JOIN Workers w ON w.id = wa.worker_id
    INNER JOIN Orders o ON o.id = wa.order_id
    INNER JOIN Customers c ON c.id = o.customer_id
    WHERE ($1 IS NULL OR wa.order_id = $1)
    ORDER BY wa.completed_at, wa.assigned_at DESC;
  `, [req.query.order_id ? Number(req.query.order_id) : null]);
  res.json({ data: result.rows });
});

const create = asyncHandler(async (req, res) => {
  validate(req);
  const result = await query(req, `
    INSERT INTO WorkAssignments(order_id, worker_id, stage)
    VALUES($1, $2, $3)
    RETURNING *;
  `, [Number(req.body.order_id), Number(req.body.worker_id), req.body.stage]);
  res.status(201).json({ data: result.rows[0] });
});

const remove = asyncHandler(async (req, res) => {
  const result = await query(req, 'DELETE FROM WorkAssignments WHERE id = $1 RETURNING id;', [Number(req.params.id)]);
  if (!result.rows[0]) throw httpError(404, 'Assignment not found');
  res.json({ data: { id: result.rows[0].id } });
});

module.exports = { rules, list, create, remove };
