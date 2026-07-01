const { body, validationResult } = require('express-validator');
const { pg, query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const rules = [
  body('customer_id').isInt({ min: 1 }),
  body('neck').optional({ nullable: true }).isFloat(),
  body('chest').optional({ nullable: true }).isFloat(),
  body('waist').optional({ nullable: true }).isFloat(),
  body('hip').optional({ nullable: true }).isFloat(),
  body('shoulder').optional({ nullable: true }).isFloat(),
  body('sleeve').optional({ nullable: true }).isFloat(),
  body('length').optional({ nullable: true }).isFloat(),
  body('collar').optional({ nullable: true }).isFloat(),
  body('shalwar_len').optional({ nullable: true }).isFloat(),
  body('pancha').optional({ nullable: true }).isFloat()
];

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw httpError(422, 'Validation failed', errors.array());
}

const getByCustomer = asyncHandler(async (req, res) => {
  const result = await query(req, `
    SELECT * FROM CustomerMeasurements
    WHERE customer_id = $1;
  `, [Number(req.params.customer_id)]);
  res.json({ data: result.rows[0] || null });
});

const upsert = asyncHandler(async (req, res) => {
  validate(req);
  const customerId = Number(req.body.customer_id);
  
  const result = await query(req, `
    INSERT INTO CustomerMeasurements(customer_id, neck, chest, waist, hip, shoulder, sleeve, length, collar, shalwar_len, pancha, updated_at)
    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
    ON CONFLICT (customer_id) DO UPDATE SET
      neck = EXCLUDED.neck, chest = EXCLUDED.chest, waist = EXCLUDED.waist, hip = EXCLUDED.hip,
      shoulder = EXCLUDED.shoulder, sleeve = EXCLUDED.sleeve, length = EXCLUDED.length,
      collar = EXCLUDED.collar, shalwar_len = EXCLUDED.shalwar_len, pancha = EXCLUDED.pancha,
      updated_at = NOW()
    RETURNING *;
  `, [
    customerId,
    req.body.neck || null,
    req.body.chest || null,
    req.body.waist || null,
    req.body.hip || null,
    req.body.shoulder || null,
    req.body.sleeve || null,
    req.body.length || null,
    req.body.collar || null,
    req.body.shalwar_len || null,
    req.body.pancha || null
  ]);
  
  res.json({ data: result.rows[0] });
});

module.exports = { rules, getByCustomer, upsert };
