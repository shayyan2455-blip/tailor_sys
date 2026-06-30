const { body, validationResult } = require('express-validator');
const { sql, query, transaction } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const stageMap = {
  Booked: ['stage_booked', 'stage_booked_at'],
  Cutting: ['stage_cutting', 'stage_cutting_at'],
  Stitching: ['stage_stitching', 'stage_stitching_at'],
  Trial: ['stage_trial', 'stage_trial_at'],
  Alteration: ['stage_alteration', 'stage_alteration_at'],
  Pressing: ['stage_pressing', 'stage_pressing_at'],
  Ready: ['stage_ready', 'stage_ready_at'],
  Delivered: ['stage_delivered', 'stage_delivered_at']
};

const toggleRules = [
  body('order_id').isInt({ min: 1 }),
  body('stage').isIn(Object.keys(stageMap)),
  body('completed').isBoolean()
];

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw httpError(422, 'Validation failed', errors.array());
}

const activeList = asyncHandler(async (req, res) => {
  const result = await query(req, `
    SELECT o.id, o.order_date, o.delivery_date, o.current_stage, o.status, c.name AS customer_name,
           wa.stage AS assigned_stage, wa.completed_at, w.name AS worker_name
    FROM dbo.Orders o
    INNER JOIN dbo.Customers c ON c.id = o.customer_id
    LEFT JOIN dbo.WorkAssignments wa ON wa.order_id = o.id AND wa.completed_at IS NULL
    LEFT JOIN dbo.Workers w ON w.id = wa.worker_id
    WHERE o.status <> N'Delivered'
      AND (@worker_id IS NULL OR wa.worker_id = @worker_id)
    ORDER BY o.delivery_date, o.id;
  `, { worker_id: { type: sql.Int, value: req.session.user.role === 'Worker' ? req.session.user.workerId : null } });
  res.json({ data: result.recordset });
});

const toggleStage = asyncHandler(async (req, res) => {
  validate(req);
  const orderId = Number(req.body.order_id);
  const stage = req.body.stage;
  const completed = Boolean(req.body.completed);
  const [flagColumn, atColumn] = stageMap[stage];

  const data = await transaction(req, async (run) => {
    if (req.session.user.role === 'Worker') {
      const assignment = await run(`
        SELECT TOP 1 id FROM dbo.WorkAssignments
        WHERE order_id = @order_id AND worker_id = @worker_id AND stage = @stage AND completed_at IS NULL;
      `, {
        order_id: { type: sql.Int, value: orderId },
        worker_id: { type: sql.Int, value: req.session.user.workerId },
        stage: { type: sql.NVarChar(20), value: stage }
      });
      if (!assignment.recordset[0]) throw httpError(403, 'This stage is not assigned to you');
    }

    await run(`
      UPDATE dbo.OrderItems
      SET ${flagColumn} = @completed, ${atColumn} = CASE WHEN @completed = 1 THEN SYSUTCDATETIME() ELSE NULL END
      WHERE order_id = @order_id;
    `, {
      completed: { type: sql.Bit, value: completed },
      order_id: { type: sql.Int, value: orderId }
    });

    await run(`
      UPDATE dbo.WorkAssignments
      SET completed_at = CASE WHEN @completed = 1 THEN SYSUTCDATETIME() ELSE NULL END
      WHERE order_id = @order_id AND stage = @stage
        AND (@worker_id IS NULL OR worker_id = @worker_id);
    `, {
      completed: { type: sql.Bit, value: completed },
      order_id: { type: sql.Int, value: orderId },
      stage: { type: sql.NVarChar(20), value: stage },
      worker_id: { type: sql.Int, value: req.session.user.role === 'Worker' ? req.session.user.workerId : null }
    });

    const order = await run('SELECT id, current_stage, status FROM dbo.Orders WHERE id = @id;', {
      id: { type: sql.Int, value: orderId }
    });
    return order.recordset[0];
  });

  res.json({ data });
});

module.exports = { toggleRules, activeList, toggleStage };
