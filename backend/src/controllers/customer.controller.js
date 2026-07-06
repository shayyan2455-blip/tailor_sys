const { body, validationResult } = require('express-validator');
const { pg, query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const rules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 160 }),
  body('mobile').trim().notEmpty().withMessage('Mobile is required').isLength({ max: 30 }),
  body('address').optional({ nullable: true }).trim().isLength({ max: 500 })
];

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw httpError(422, 'Validation failed', errors.array());
}

const list = asyncHandler(async (req, res) => {
  const search = `%${req.query.search || ''}%`;
  const cursor = Number(req.query.cursor) || 0;
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  
  const result = await query(req, `
    SELECT id, name, mobile, address, created_at
    FROM Customers
    WHERE ($1 = '%%' OR LOWER(name) LIKE LOWER($1) OR mobile LIKE $1)
      AND id < $2
    ORDER BY id DESC
    LIMIT $3;
  `, { search, cursor: cursor || 999999999, limit });
  
  const nextCursor = result.rows.length > 0 ? result.rows[result.rows.length - 1].id : null;
  
  res.json({ 
    data: result.rows,
    pagination: {
      nextCursor,
      hasMore: result.rows.length === limit
    }
  });
});

const get = asyncHandler(async (req, res) => {
  const result = await query(req, `
    SELECT id, name, mobile, address, created_at FROM Customers WHERE id = $1;
  `, { id: Number(req.params.id) });
  if (!result.rows[0]) throw httpError(404, 'Customer not found');
  res.json({ data: result.rows[0] });
});

const create = asyncHandler(async (req, res) => {
  validate(req);
  const result = await query(req, `
    INSERT INTO Customers(name, mobile, address)
    VALUES ($1, $2, $3)
    RETURNING id, name, mobile, address, created_at;
  `, { name: req.body.name, mobile: req.body.mobile, address: req.body.address || null });
  res.status(201).json({ data: result.rows[0] });
});

const update = asyncHandler(async (req, res) => {
  validate(req);
  const result = await query(req, `
    UPDATE Customers
    SET name = $1, mobile = $2, address = $3
    WHERE id = $4
    RETURNING id, name, mobile, address, created_at;
  `, { name: req.body.name, mobile: req.body.mobile, address: req.body.address || null, id: Number(req.params.id) });
  if (!result.rows[0]) throw httpError(404, 'Customer not found');
  res.json({ data: result.rows[0] });
});

const remove = asyncHandler(async (req, res) => {
  const result = await query(req, 'DELETE FROM Customers WHERE id = $1 RETURNING id;', { id: Number(req.params.id) });
  if (!result.rows[0]) throw httpError(404, 'Customer not found');
  res.json({ data: { id: result.rows[0].id } });
});

module.exports = { rules, list, get, create, update, remove };
