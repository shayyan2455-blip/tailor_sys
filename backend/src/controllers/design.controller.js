const { body, validationResult } = require('express-validator');
const { sql, query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const rules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('description').optional({ nullable: true }).trim().isLength({ max: 500 }),
  body('default_rate').isFloat({ min: 0 }).withMessage('Default rate must be zero or greater'),
  body('is_active').optional().isBoolean()
];

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw httpError(422, 'Validation failed', errors.array());
}

const list = asyncHandler(async (_req, res) => {
  const result = await query(_req, 'SELECT id, name, description, default_rate, is_active FROM dbo.Designs ORDER BY is_active DESC, name;');
  res.json({ data: result.recordset });
});

const create = asyncHandler(async (req, res) => {
  validate(req);
  const result = await query(req, `
    INSERT INTO dbo.Designs(name, description, default_rate, is_active)
    OUTPUT inserted.id, inserted.name, inserted.description, inserted.default_rate, inserted.is_active
    VALUES (@name, @description, @default_rate, @is_active);
  `, {
    name: { type: sql.NVarChar(120), value: req.body.name },
    description: { type: sql.NVarChar(500), value: req.body.description || null },
    default_rate: { type: sql.Decimal(12, 2), value: Number(req.body.default_rate || 0) },
    is_active: { type: sql.Bit, value: req.body.is_active !== false }
  });
  res.status(201).json({ data: result.recordset[0] });
});

const update = asyncHandler(async (req, res) => {
  validate(req);
  const result = await query(req, `
    UPDATE dbo.Designs
    SET name = @name, description = @description, default_rate = @default_rate, is_active = @is_active
    OUTPUT inserted.id, inserted.name, inserted.description, inserted.default_rate, inserted.is_active
    WHERE id = @id;
  `, {
    id: { type: sql.Int, value: Number(req.params.id) },
    name: { type: sql.NVarChar(120), value: req.body.name },
    description: { type: sql.NVarChar(500), value: req.body.description || null },
    default_rate: { type: sql.Decimal(12, 2), value: Number(req.body.default_rate || 0) },
    is_active: { type: sql.Bit, value: req.body.is_active !== false }
  });
  if (!result.recordset[0]) throw httpError(404, 'Design not found');
  res.json({ data: result.recordset[0] });
});

const remove = asyncHandler(async (req, res) => {
  const result = await query(req, 'UPDATE dbo.Designs SET is_active = 0 OUTPUT inserted.id WHERE id = @id;', {
    id: { type: sql.Int, value: Number(req.params.id) }
  });
  if (!result.recordset[0]) throw httpError(404, 'Design not found');
  res.json({ data: { id: result.recordset[0].id } });
});

module.exports = { rules, list, create, update, remove };
