const { body, validationResult } = require('express-validator');
const { pg, query } = require('../config/db');
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
  const result = await query(req, 'SELECT id, name, cost_per_unit, supplier, is_active FROM Fabrics ORDER BY is_active DESC, name;');
  res.json({ data: result.rows });
});

const create = asyncHandler(async (req, res) => {
  validate(req);
  const result = await query(req, `
    INSERT INTO Fabrics(name, cost_per_unit, supplier, is_active)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, cost_per_unit, supplier, is_active;
  `, {
    name: req.body.name,
    cost_per_unit: Number(req.body.cost_per_unit || 0),
    supplier: req.body.supplier || null,
    is_active: req.body.is_active !== false
  });
  res.status(201).json({ data: result.rows[0] });
});

const update = asyncHandler(async (req, res) => {
  validate(req);
  const result = await query(req, `
    UPDATE Fabrics
    SET name = $1, cost_per_unit = $2, supplier = $3, is_active = $4
    WHERE id = $5
    RETURNING id, name, cost_per_unit, supplier, is_active;
  `, {
    name: req.body.name,
    cost_per_unit: Number(req.body.cost_per_unit || 0),
    supplier: req.body.supplier || null,
    is_active: req.body.is_active !== false,
    id: Number(req.params.id)
  });
  if (!result.rows[0]) throw httpError(404, 'Fabric not found');
  res.json({ data: result.rows[0] });
});

const remove = asyncHandler(async (req, res) => {
  const result = await query(req, 'UPDATE Fabrics SET is_active = false WHERE id = $1 RETURNING id;', { id: Number(req.params.id) });
  if (!result.rows[0]) throw httpError(404, 'Fabric not found');
  res.json({ data: { id: result.rows[0].id } });
});

module.exports = { rules, list, create, update, remove };
