const { body, validationResult } = require('express-validator');
const { sql, query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const rules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('mobile').optional({ nullable: true }).trim().isLength({ max: 30 }),
  body('wage_rate').isFloat({ min: 0 }).withMessage('Wage rate must be zero or greater'),
  body('is_active').optional().isBoolean()
];

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw httpError(422, 'Validation failed', errors.array());
}

const list = asyncHandler(async (req, res) => {
  const result = await query(req, `
    SELECT id, name, mobile, wage_rate, is_active, created_at
    FROM dbo.Workers
    ORDER BY is_active DESC, name;
  `);
  res.json({ data: result.recordset });
});

const get = asyncHandler(async (req, res) => {
  const result = await query(req, 'SELECT id, name, mobile, wage_rate, is_active, created_at FROM dbo.Workers WHERE id = @id;', {
    id: { type: sql.Int, value: Number(req.params.id) }
  });
  if (!result.recordset[0]) throw httpError(404, 'Worker not found');
  res.json({ data: result.recordset[0] });
});

const create = asyncHandler(async (req, res) => {
  validate(req);
  const result = await query(req, `
    INSERT INTO dbo.Workers(name, mobile, wage_rate, is_active)
    OUTPUT inserted.id, inserted.name, inserted.mobile, inserted.wage_rate, inserted.is_active, inserted.created_at
    VALUES (@name, @mobile, @wage_rate, @is_active);
  `, {
    name: { type: sql.NVarChar(120), value: req.body.name },
    mobile: { type: sql.NVarChar(30), value: req.body.mobile || null },
    wage_rate: { type: sql.Decimal(12, 2), value: Number(req.body.wage_rate || 0) },
    is_active: { type: sql.Bit, value: req.body.is_active !== false }
  });
  res.status(201).json({ data: result.recordset[0] });
});

const update = asyncHandler(async (req, res) => {
  validate(req);
  const result = await query(req, `
    UPDATE dbo.Workers
    SET name = @name, mobile = @mobile, wage_rate = @wage_rate, is_active = @is_active
    OUTPUT inserted.id, inserted.name, inserted.mobile, inserted.wage_rate, inserted.is_active, inserted.created_at
    WHERE id = @id;
  `, {
    id: { type: sql.Int, value: Number(req.params.id) },
    name: { type: sql.NVarChar(120), value: req.body.name },
    mobile: { type: sql.NVarChar(30), value: req.body.mobile || null },
    wage_rate: { type: sql.Decimal(12, 2), value: Number(req.body.wage_rate || 0) },
    is_active: { type: sql.Bit, value: req.body.is_active !== false }
  });
  if (!result.recordset[0]) throw httpError(404, 'Worker not found');
  res.json({ data: result.recordset[0] });
});

const remove = asyncHandler(async (req, res) => {
  const result = await query(req, 'UPDATE dbo.Workers SET is_active = 0 OUTPUT inserted.id WHERE id = @id;', {
    id: { type: sql.Int, value: Number(req.params.id) }
  });
  if (!result.recordset[0]) throw httpError(404, 'Worker not found');
  res.json({ data: { id: result.recordset[0].id } });
});

module.exports = { rules, list, get, create, update, remove };
