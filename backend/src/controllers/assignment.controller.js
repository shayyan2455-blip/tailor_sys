const { body, validationResult } = require('express-validator');
const { sql, query } = require('../config/db');
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
    FROM dbo.WorkAssignments wa
    INNER JOIN dbo.Workers w ON w.id = wa.worker_id
    INNER JOIN dbo.Orders o ON o.id = wa.order_id
    INNER JOIN dbo.Customers c ON c.id = o.customer_id
    WHERE (@order_id IS NULL OR wa.order_id = @order_id)
    ORDER BY wa.completed_at, wa.assigned_at DESC;
  `, { order_id: { type: sql.Int, value: req.query.order_id ? Number(req.query.order_id) : null } });
  res.json({ data: result.recordset });
});

const create = asyncHandler(async (req, res) => {
  validate(req);
  const result = await query(req, `
    INSERT INTO dbo.WorkAssignments(order_id, worker_id, stage)
    OUTPUT inserted.*
    VALUES(@order_id, @worker_id, @stage);
  `, {
    order_id: { type: sql.Int, value: Number(req.body.order_id) },
    worker_id: { type: sql.Int, value: Number(req.body.worker_id) },
    stage: { type: sql.NVarChar(20), value: req.body.stage }
  });
  res.status(201).json({ data: result.recordset[0] });
});

const remove = asyncHandler(async (req, res) => {
  const result = await query(req, 'DELETE FROM dbo.WorkAssignments OUTPUT deleted.id WHERE id = @id;', {
    id: { type: sql.Int, value: Number(req.params.id) }
  });
  if (!result.recordset[0]) throw httpError(404, 'Assignment not found');
  res.json({ data: { id: result.recordset[0].id } });
});

module.exports = { rules, list, create, remove };
