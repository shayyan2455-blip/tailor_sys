const { body, validationResult } = require('express-validator');
const { sql, query } = require('../config/db');
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
  const result = await query(req, `
    SELECT TOP 200 id, name, mobile, address, created_at
    FROM dbo.Customers
    WHERE (@search = '%%' OR name LIKE @search OR mobile LIKE @search)
    ORDER BY created_at DESC, id DESC;
  `, { search: { type: sql.NVarChar(200), value: search } });
  res.json({ data: result.recordset });
});

const get = asyncHandler(async (req, res) => {
  const result = await query(req, `
    SELECT id, name, mobile, address, created_at FROM dbo.Customers WHERE id = @id;
  `, { id: { type: sql.Int, value: Number(req.params.id) } });
  if (!result.recordset[0]) throw httpError(404, 'Customer not found');
  res.json({ data: result.recordset[0] });
});

const create = asyncHandler(async (req, res) => {
  validate(req);
  const result = await query(req, `
    INSERT INTO dbo.Customers(name, mobile, address)
    OUTPUT inserted.id, inserted.name, inserted.mobile, inserted.address, inserted.created_at
    VALUES (@name, @mobile, @address);
  `, {
    name: { type: sql.NVarChar(160), value: req.body.name },
    mobile: { type: sql.NVarChar(30), value: req.body.mobile },
    address: { type: sql.NVarChar(500), value: req.body.address || null }
  });
  res.status(201).json({ data: result.recordset[0] });
});

const update = asyncHandler(async (req, res) => {
  validate(req);
  const result = await query(req, `
    UPDATE dbo.Customers
    SET name = @name, mobile = @mobile, address = @address
    OUTPUT inserted.id, inserted.name, inserted.mobile, inserted.address, inserted.created_at
    WHERE id = @id;
  `, {
    id: { type: sql.Int, value: Number(req.params.id) },
    name: { type: sql.NVarChar(160), value: req.body.name },
    mobile: { type: sql.NVarChar(30), value: req.body.mobile },
    address: { type: sql.NVarChar(500), value: req.body.address || null }
  });
  if (!result.recordset[0]) throw httpError(404, 'Customer not found');
  res.json({ data: result.recordset[0] });
});

const remove = asyncHandler(async (req, res) => {
  const result = await query(req, 'DELETE FROM dbo.Customers OUTPUT deleted.id WHERE id = @id;', {
    id: { type: sql.Int, value: Number(req.params.id) }
  });
  if (!result.recordset[0]) throw httpError(404, 'Customer not found');
  res.json({ data: { id: result.recordset[0].id } });
});

module.exports = { rules, list, get, create, update, remove };
