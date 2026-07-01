const { body, validationResult } = require('express-validator');
const { pg, query } = require('../config/db');
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
  const result = await query(_req, 'SELECT id, name, description, default_rate, is_active FROM Designs ORDER BY is_active DESC, name;');
  res.json({ data: result.rows });
});

const create = asyncHandler(async (req, res) => {
  validate(req);
  const result = await query(req, `
    INSERT INTO Designs(name, description, default_rate, is_active)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, description, default_rate, is_active;
  `, {
    name: req.body.name,
    description: req.body.description || null,
    default_rate: Number(req.body.default_rate || 0),
    is_active: req.body.is_active !== false
  });
  res.status(201).json({ data: result.rows[0] });
});

const update = asyncHandler(async (req, res) => {
  validate(req);
  const result = await query(req, `
    UPDATE Designs
    SET name = $1, description = $2, default_rate = $3, is_active = $4
    WHERE id = $5
    RETURNING id, name, description, default_rate, is_active;
  `, {
    name: req.body.name,
    description: req.body.description || null,
    default_rate: Number(req.body.default_rate || 0),
    is_active: req.body.is_active !== false,
    id: Number(req.params.id)
  });
  if (!result.rows[0]) throw httpError(404, 'Design not found');
  res.json({ data: result.rows[0] });
});

const remove = asyncHandler(async (req, res) => {
  const result = await query(req, 'UPDATE Designs SET is_active = false WHERE id = $1 RETURNING id;', { id: Number(req.params.id) });
  if (!result.rows[0]) throw httpError(404, 'Design not found');
  res.json({ data: { id: result.rows[0].id } });
});

module.exports = { rules, list, create, update, remove };
