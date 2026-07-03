const { body, validationResult } = require('express-validator');
const { pg, query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const rules = [
  body('supplier_name').optional({ nullable: true }).trim().isLength({ max: 160 }),
  body('description').trim().notEmpty().isLength({ max: 250 }),
  body('cost').isFloat({ min: 0 }),
  body('paid_amount').isFloat({ min: 0 }),
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
    FROM Expenses e INNER JOIN Users u ON u.id = e.recorded_by
    WHERE ($1::date IS NULL OR e.expense_date >= $1::date)
      AND ($2::date IS NULL OR e.expense_date <= $2::date)
    ORDER BY e.expense_date DESC, e.id DESC;
  `, [req.query.from || null, req.query.to || null]);
  res.json({ data: result.rows });
});

const create = asyncHandler(async (req, res) => {
  validate(req);
  const cost = Number(req.body.cost || 0);
  const paidAmount = Number(req.body.paid_amount || 0);
  const balance = cost - paidAmount;
  const result = await query(req, `
    INSERT INTO Expenses(supplier_name, description, cost, paid_amount, balance, category, expense_date, recorded_by)
    VALUES($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `, [
    req.body.supplier_name || null,
    req.body.description,
    cost,
    paidAmount,
    balance,
    req.body.category,
    req.body.expense_date,
    req.session.user.id
  ]);
  res.status(201).json({ data: result.rows[0] });
});

const update = asyncHandler(async (req, res) => {
  validate(req);
  const cost = Number(req.body.cost || 0);
  const paidAmount = Number(req.body.paid_amount || 0);
  const balance = cost - paidAmount;
  const result = await query(req, `
    UPDATE Expenses
    SET supplier_name=$1, description=$2, cost=$3, paid_amount=$4, balance=$5, category=$6, expense_date=$7
    WHERE id=$8
    RETURNING *;
  `, [
    req.body.supplier_name || null,
    req.body.description,
    cost,
    paidAmount,
    balance,
    req.body.category,
    req.body.expense_date,
    Number(req.params.id)
  ]);
  if (!result.rows[0]) throw httpError(404, 'Expense not found');
  res.json({ data: result.rows[0] });
});

const remove = asyncHandler(async (req, res) => {
  const result = await query(req, 'DELETE FROM Expenses WHERE id=$1 RETURNING id;', [Number(req.params.id)]);
  if (!result.rows[0]) throw httpError(404, 'Expense not found');
  res.json({ data: { id: result.rows[0].id } });
});

module.exports = { rules, list, create, update, remove };
