const { body, validationResult } = require('express-validator');
const { sql, query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const rules = [
  body('description').trim().notEmpty().isLength({ max: 250 }),
  body('amount').isFloat({ min: 0.01 }),
  body('category').trim().notEmpty().isLength({ max: 80 }),
  body('expense_date').isISO8601()
];

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw httpError(422, 'Validation failed', errors.array());
}

const list = asyncHandler(async (req, res) => {
  const result = await query(req, `
    SELECT e.*, u.username AS recorded_by_name
    FROM dbo.Expenses e INNER JOIN dbo.Users u ON u.id = e.recorded_by
    WHERE (@from IS NULL OR e.expense_date >= @from)
      AND (@to IS NULL OR e.expense_date <= @to)
    ORDER BY e.expense_date DESC, e.id DESC;
  `, {
    from: { type: sql.Date, value: req.query.from || null },
    to: { type: sql.Date, value: req.query.to || null }
  });
  res.json({ data: result.recordset });
});

const create = asyncHandler(async (req, res) => {
  validate(req);
  const result = await query(req, `
    INSERT INTO dbo.Expenses(description, amount, category, expense_date, recorded_by)
    OUTPUT inserted.*
    VALUES(@description, @amount, @category, @expense_date, @recorded_by);
  `, {
    description: { type: sql.NVarChar(250), value: req.body.description },
    amount: { type: sql.Decimal(12, 2), value: Number(req.body.amount) },
    category: { type: sql.NVarChar(80), value: req.body.category },
    expense_date: { type: sql.Date, value: req.body.expense_date },
    recorded_by: { type: sql.Int, value: req.session.user.id }
  });
  res.status(201).json({ data: result.recordset[0] });
});

const update = asyncHandler(async (req, res) => {
  validate(req);
  const result = await query(req, `
    UPDATE dbo.Expenses
    SET description=@description, amount=@amount, category=@category, expense_date=@expense_date
    OUTPUT inserted.*
    WHERE id=@id;
  `, {
    id: { type: sql.Int, value: Number(req.params.id) },
    description: { type: sql.NVarChar(250), value: req.body.description },
    amount: { type: sql.Decimal(12, 2), value: Number(req.body.amount) },
    category: { type: sql.NVarChar(80), value: req.body.category },
    expense_date: { type: sql.Date, value: req.body.expense_date }
  });
  if (!result.recordset[0]) throw httpError(404, 'Expense not found');
  res.json({ data: result.recordset[0] });
});

const remove = asyncHandler(async (req, res) => {
  const result = await query(req, 'DELETE FROM dbo.Expenses OUTPUT deleted.id WHERE id=@id;', {
    id: { type: sql.Int, value: Number(req.params.id) }
  });
  if (!result.recordset[0]) throw httpError(404, 'Expense not found');
  res.json({ data: { id: result.recordset[0].id } });
});

module.exports = { rules, list, create, update, remove };
