const { body, validationResult } = require('express-validator');
const { pg, query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const createRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('mobile').optional({ nullable: true }).trim().isLength({ max: 30 }),
  body('wage_rate').optional({ nullable: true }).isFloat({ min: 0 }),
  body('default_stage').optional({ nullable: true }).isIn(['Booked', 'Cutting', 'Stitching', 'Trial', 'Alteration', 'Pressing', 'Ready', 'Delivered']),
  body('is_active').optional().isBoolean()
];

const updateRules = [
  body('name').optional({ nullable: false }).trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('mobile').optional({ nullable: true }).trim().isLength({ max: 30 }),
  body('wage_rate').optional({ nullable: true }).isFloat({ min: 0 }),
  body('default_stage').optional({ nullable: true }).isIn(['Booked', 'Cutting', 'Stitching', 'Trial', 'Alteration', 'Pressing', 'Ready', 'Delivered']),
  body('is_active').optional().isBoolean()
];

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw httpError(422, 'Validation failed', errors.array());
}

const list = asyncHandler(async (req, res) => {
  const result = await query(req, `
    SELECT id, name, mobile, wage_rate, default_stage, is_active, created_at
    FROM Workers
    ORDER BY is_active DESC, name;
  `);
  res.json({ data: result.rows });
});

const get = asyncHandler(async (req, res) => {
  const result = await query(req, 'SELECT id, name, mobile, wage_rate, default_stage, is_active, created_at FROM Workers WHERE id = $1;', { id: Number(req.params.id) });
  if (!result.rows[0]) throw httpError(404, 'Worker not found');
  res.json({ data: result.rows[0] });
});

const create = asyncHandler(async (req, res) => {
  validate(req);
  const result = await query(req, `
    INSERT INTO Workers(name, mobile, wage_rate, default_stage, is_active)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, mobile, wage_rate, default_stage, is_active, created_at;
  `, {
    name: req.body.name,
    mobile: req.body.mobile || null,
    wage_rate: Number(req.body.wage_rate || 0),
    default_stage: req.body.default_stage || null,
    is_active: req.body.is_active !== false
  });
  res.status(201).json({ data: result.rows[0] });
});

const update = asyncHandler(async (req, res) => {
  validate(req);
  const result = await query(req, `
    UPDATE Workers
    SET name = COALESCE($1, name),
        mobile = COALESCE($2, mobile),
        wage_rate = COALESCE($3, wage_rate),
        default_stage = COALESCE($4, default_stage),
        is_active = COALESCE($5, is_active)
    WHERE id = $6
    RETURNING id, name, mobile, wage_rate, default_stage, is_active, created_at;
  `, {
    name: req.body.name,
    mobile: req.body.mobile,
    wage_rate: req.body.wage_rate ? Number(req.body.wage_rate) : null,
    default_stage: req.body.default_stage,
    is_active: req.body.is_active,
    id: Number(req.params.id)
  });
  if (!result.rows[0]) throw httpError(404, 'Worker not found');
  res.json({ data: result.rows[0] });
});

const remove = asyncHandler(async (req, res) => {
  const result = await query(req, 'UPDATE Workers SET is_active = false WHERE id = $1 RETURNING id;', { id: Number(req.params.id) });
  if (!result.rows[0]) throw httpError(404, 'Worker not found');
  res.json({ data: { id: result.rows[0].id } });
});

module.exports = { createRules, updateRules, list, get, create, update, remove };
