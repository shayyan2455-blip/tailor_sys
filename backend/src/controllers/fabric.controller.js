const { body, validationResult } = require('express-validator');
const { sql, query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const rules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('cost_per_unit').isFloat({ min: 0 }).withMessage('Cost per unit must be zero or greater'),
  body('supplier').optional({ nullable: true }).trim().isLength({ max: 160 }),
  body('is_active').optional().isBoolean()
];

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw httpError(422, 'Validation failed', errors.array());
}

const list = asyncHandler(async (req, res) => {
  const result = await query(req, 'SELECT id, name, cost_per_unit, supplier, is_active FROM dbo.Fabrics ORDER BY is_active DESC, name;');
  res.json({ data: result.recordset });
});

const create = asyncHandler(async (req, res) => {
  validate(req);
  const result = await query(req, `
    INSERT INTO dbo.Fabrics(name, cost_per_unit, supplier, is_active)
    OUTPUT inserted.id, inserted.name, inserted.cost_per_unit, inserted.supplier, inserted.is_active
    VALUES (@name, @cost_per_unit, @supplier, @is_active);
  `, {
    name: { type: sql.NVarChar(120), value: req.body.name },
    cost_per_unit: { type: sql.Decimal(12, 2), value: Number(req.body.cost_per_unit || 0) },
    supplier: { type: sql.NVarChar(160), value: req.body.supplier || null },
    is_active: { type: sql.Bit, value: req.body.is_active !== false }
  });
  res.status(201).json({ data: result.recordset[0] });
});

const update = asyncHandler(async (req, res) => {
  validate(req);
  const result = await query(req, `
    UPDATE dbo.Fabrics
    SET name = @name, cost_per_unit = @cost_per_unit, supplier = @supplier, is_active = @is_active
    OUTPUT inserted.id, inserted.name, inserted.cost_per_unit, inserted.supplier, inserted.is_active
    WHERE id = @id;
  `, {
    id: { type: sql.Int, value: Number(req.params.id) },
    name: { type: sql.NVarChar(120), value: req.body.name },
    cost_per_unit: { type: sql.Decimal(12, 2), value: Number(req.body.cost_per_unit || 0) },
    supplier: { type: sql.NVarChar(160), value: req.body.supplier || null },
    is_active: { type: sql.Bit, value: req.body.is_active !== false }
  });
  if (!result.recordset[0]) throw httpError(404, 'Fabric not found');
  res.json({ data: result.recordset[0] });
});

const remove = asyncHandler(async (req, res) => {
  const result = await query(req, 'UPDATE dbo.Fabrics SET is_active = 0 OUTPUT inserted.id WHERE id = @id;', {
    id: { type: sql.Int, value: Number(req.params.id) }
  });
  if (!result.recordset[0]) throw httpError(404, 'Fabric not found');
  res.json({ data: { id: result.recordset[0].id } });
});

module.exports = { rules, list, create, update, remove };
