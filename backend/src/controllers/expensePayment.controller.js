const { body, validationResult } = require('express-validator');
const { pg, query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const rules = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('payment_type').trim().notEmpty().withMessage('Payment type is required').isLength({ max: 20 }),
  body('notes').optional({ nullable: true }).trim().isLength({ max: 500 })
];

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw httpError(422, 'Validation failed', errors.array());
}

const list = asyncHandler(async (req, res) => {
  const result = await query(req, `
    SELECT ep.*, u.username AS recorded_by_name
    FROM ExpensePayments ep
    INNER JOIN Users u ON u.id = ep.recorded_by
    WHERE ep.expense_id = $1
    ORDER BY ep.payment_date DESC, ep.id DESC;
  `, [Number(req.params.expenseId)]);
  res.json({ data: result.rows });
});

const create = asyncHandler(async (req, res) => {
  validate(req);
  
  const expenseId = Number(req.params.expenseId);
  if (!expenseId || isNaN(expenseId)) throw httpError(400, 'Invalid expense ID');
  
  // Check if expense exists
  const expenseCheck = await query(req, 'SELECT id, cost, total_paid, balance FROM Expenses WHERE id = $1;', [expenseId]);
  if (!expenseCheck.rows[0]) throw httpError(404, 'Expense not found');
  
  const expense = expenseCheck.rows[0];
  const paymentAmount = Number(req.body.amount);
  
  // Check if payment exceeds remaining balance
  if (paymentAmount > expense.balance) {
    throw httpError(400, `Payment amount (${paymentAmount}) exceeds remaining balance (${expense.balance})`);
  }
  
  const result = await query(req, `
    INSERT INTO ExpensePayments(expense_id, amount, payment_date, payment_type, notes, recorded_by)
    VALUES($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `, [
    expenseId,
    paymentAmount,
    req.body.payment_date || new Date().toISOString().split('T')[0],
    req.body.payment_type,
    req.body.notes || null,
    req.session.user.id
  ]);
  res.status(201).json({ data: result.rows[0] });
});

const update = asyncHandler(async (req, res) => {
  validate(req);
  
  const expenseId = Number(req.params.expenseId);
  const paymentId = Number(req.params.id);
  if (!expenseId || isNaN(expenseId)) throw httpError(400, 'Invalid expense ID');
  if (!paymentId || isNaN(paymentId)) throw httpError(400, 'Invalid payment ID');
  
  const result = await query(req, `
    UPDATE ExpensePayments
    SET amount=$1, payment_date=$2, payment_type=$3, notes=$4
    WHERE id=$5 AND expense_id=$6
    RETURNING *;
  `, [
    Number(req.body.amount),
    req.body.payment_date,
    req.body.payment_type,
    req.body.notes || null,
    paymentId,
    expenseId
  ]);
  if (!result.rows[0]) throw httpError(404, 'Expense payment not found');
  res.json({ data: result.rows[0] });
});

const remove = asyncHandler(async (req, res) => {
  const expenseId = Number(req.params.expenseId);
  const paymentId = Number(req.params.id);
  if (!expenseId || isNaN(expenseId)) throw httpError(400, 'Invalid expense ID');
  if (!paymentId || isNaN(paymentId)) throw httpError(400, 'Invalid payment ID');
  
  const result = await query(req, 'DELETE FROM ExpensePayments WHERE id=$1 AND expense_id=$2 RETURNING id;', [
    paymentId,
    expenseId
  ]);
  if (!result.rows[0]) throw httpError(404, 'Expense payment not found');
  res.json({ data: { id: result.rows[0].id } });
});

module.exports = { rules, list, create, update, remove };
