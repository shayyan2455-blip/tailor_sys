const { body, validationResult } = require('express-validator');
const { sql, query, transaction } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const measurementFields = ['neck', 'chest', 'waist', 'hip', 'shoulder', 'sleeve', 'length', 'collar', 'shalwar_len', 'pancha'];

const rules = [
  body('customer_id').isInt({ min: 1 }).withMessage('Customer is required'),
  body('order_date').isISO8601().withMessage('Order date is required'),
  body('delivery_date').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body('items').isArray({ min: 1 }).withMessage('At least one order item is required'),
  body('items.*.garment_type').trim().notEmpty().withMessage('Garment type is required'),
  body('items.*.qty').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.rate').isFloat({ min: 0 }).withMessage('Rate must be zero or greater'),
  body('advance').optional().isFloat({ min: 0 })
];

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw httpError(422, 'Validation failed', errors.array());
}

function itemParams(item, orderId, index) {
  return {
    [`order_id_${index}`]: { type: sql.Int, value: orderId },
    [`garment_type_${index}`]: { type: sql.NVarChar(100), value: item.garment_type },
    [`qty_${index}`]: { type: sql.Int, value: Number(item.qty) },
    [`rate_${index}`]: { type: sql.Decimal(12, 2), value: Number(item.rate) },
    [`fabric_id_${index}`]: { type: sql.Int, value: item.fabric_id || null },
    [`remarks_${index}`]: { type: sql.NVarChar(500), value: item.remarks || null }
  };
}

async function insertItems(run, orderId, items) {
  for (let index = 0; index < items.length; index += 1) {
    await run(`
      INSERT INTO dbo.OrderItems(order_id, garment_type, qty, rate, fabric_id, remarks, stage_booked_at)
      VALUES (@order_id_${index}, @garment_type_${index}, @qty_${index}, @rate_${index}, @fabric_id_${index}, @remarks_${index}, SYSUTCDATETIME());
    `, itemParams(items[index], orderId, index));
  }
}

function measurementParams(orderId, measurements = {}) {
  const params = { order_id: { type: sql.Int, value: orderId } };
  for (const field of measurementFields) {
    params[field] = { type: sql.Decimal(6, 2), value: measurements[field] === '' || measurements[field] == null ? null : Number(measurements[field]) };
  }
  return params;
}

async function upsertMeasurement(run, orderId, measurements) {
  await run(`
    MERGE dbo.Measurements AS target
    USING (SELECT @order_id AS order_id) AS source
    ON target.order_id = source.order_id
    WHEN MATCHED THEN UPDATE SET
      neck=@neck, chest=@chest, waist=@waist, hip=@hip, shoulder=@shoulder, sleeve=@sleeve,
      length=@length, collar=@collar, shalwar_len=@shalwar_len, pancha=@pancha
    WHEN NOT MATCHED THEN INSERT(order_id, neck, chest, waist, hip, shoulder, sleeve, length, collar, shalwar_len, pancha)
      VALUES(@order_id, @neck, @chest, @waist, @hip, @shoulder, @sleeve, @length, @collar, @shalwar_len, @pancha);
  `, measurementParams(orderId, measurements));
}

const list = asyncHandler(async (req, res) => {
  const result = await query(req, `
    SELECT TOP 300 o.id, o.order_date, o.delivery_date, o.total_amount, o.advance, o.balance,
           o.current_stage, o.status, c.name AS customer_name, c.mobile
    FROM dbo.Orders o
    INNER JOIN dbo.Customers c ON c.id = o.customer_id
    WHERE (@status IS NULL OR o.status = @status)
      AND (@stage IS NULL OR o.current_stage = @stage)
      AND (@from IS NULL OR o.order_date >= @from)
      AND (@to IS NULL OR o.order_date <= @to)
    ORDER BY o.order_date DESC, o.id DESC;
  `, {
    status: { type: sql.NVarChar(20), value: req.query.status || null },
    stage: { type: sql.NVarChar(20), value: req.query.stage || null },
    from: { type: sql.Date, value: req.query.from || null },
    to: { type: sql.Date, value: req.query.to || null }
  });
  res.json({ data: result.recordset });
});

const detail = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const result = await query(req, `
    SELECT o.*, c.name AS customer_name, c.mobile, c.address
    FROM dbo.Orders o INNER JOIN dbo.Customers c ON c.id = o.customer_id
    WHERE o.id = @id;
    SELECT oi.*, f.name AS fabric_name
    FROM dbo.OrderItems oi LEFT JOIN dbo.Fabrics f ON f.id = oi.fabric_id
    WHERE oi.order_id = @id ORDER BY oi.id;
    SELECT * FROM dbo.Measurements WHERE order_id = @id;
    SELECT p.*, u.username AS recorded_by_name
    FROM dbo.Payments p INNER JOIN dbo.Users u ON u.id = p.recorded_by
    WHERE p.order_id = @id ORDER BY p.payment_date, p.id;
  `, { id: { type: sql.Int, value: id } });
  if (!result.recordsets[0][0]) throw httpError(404, 'Order not found');
  res.json({
    data: {
      order: result.recordsets[0][0],
      items: result.recordsets[1],
      measurements: result.recordsets[2][0] || null,
      payments: result.recordsets[3]
    }
  });
});

const create = asyncHandler(async (req, res) => {
  validate(req);
  const data = await transaction(req, async (run) => {
    const inserted = await run(`
      INSERT INTO dbo.Orders(customer_id, order_date, delivery_date, notes, created_by)
      OUTPUT inserted.id
      VALUES (@customer_id, @order_date, @delivery_date, @notes, @created_by);
    `, {
      customer_id: { type: sql.Int, value: Number(req.body.customer_id) },
      order_date: { type: sql.Date, value: req.body.order_date },
      delivery_date: { type: sql.Date, value: req.body.delivery_date || null },
      notes: { type: sql.NVarChar(1000), value: req.body.notes || null },
      created_by: { type: sql.Int, value: req.session.user.id }
    });
    const orderId = inserted.recordset[0].id;
    await insertItems(run, orderId, req.body.items);
    await upsertMeasurement(run, orderId, req.body.measurements || {});
    if (Number(req.body.advance || 0) > 0) {
      await run(`
        INSERT INTO dbo.Payments(order_id, amount, payment_date, payment_type, reference, notes, recorded_by)
        VALUES(@order_id, @amount, @payment_date, N'Advance', @reference, @notes, @recorded_by);
      `, {
        order_id: { type: sql.Int, value: orderId },
        amount: { type: sql.Decimal(12, 2), value: Number(req.body.advance) },
        payment_date: { type: sql.Date, value: req.body.order_date },
        reference: { type: sql.NVarChar(120), value: req.body.advance_reference || null },
        notes: { type: sql.NVarChar(500), value: 'Order advance' },
        recorded_by: { type: sql.Int, value: req.session.user.id }
      });
    }
    const summary = await run('SELECT * FROM dbo.Orders WHERE id = @id;', { id: { type: sql.Int, value: orderId } });
    return summary.recordset[0];
  });
  res.status(201).json({ data });
});

const update = asyncHandler(async (req, res) => {
  validate(req);
  const orderId = Number(req.params.id);
  const data = await transaction(req, async (run) => {
    const updated = await run(`
      UPDATE dbo.Orders
      SET customer_id=@customer_id, order_date=@order_date, delivery_date=@delivery_date, notes=@notes
      OUTPUT inserted.id
      WHERE id=@id;
    `, {
      id: { type: sql.Int, value: orderId },
      customer_id: { type: sql.Int, value: Number(req.body.customer_id) },
      order_date: { type: sql.Date, value: req.body.order_date },
      delivery_date: { type: sql.Date, value: req.body.delivery_date || null },
      notes: { type: sql.NVarChar(1000), value: req.body.notes || null }
    });
    if (!updated.recordset[0]) throw httpError(404, 'Order not found');
    await run('DELETE FROM dbo.OrderItems WHERE order_id=@id;', { id: { type: sql.Int, value: orderId } });
    await insertItems(run, orderId, req.body.items);
    await upsertMeasurement(run, orderId, req.body.measurements || {});
    const summary = await run('SELECT * FROM dbo.Orders WHERE id = @id;', { id: { type: sql.Int, value: orderId } });
    return summary.recordset[0];
  });
  res.json({ data });
});

module.exports = { rules, list, detail, create, update };
