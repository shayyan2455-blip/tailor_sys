const { body, validationResult } = require('express-validator');
const { pg, query, transaction } = require('../config/db');
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
  body('completed').optional({ nullable: true }).isBoolean(),
  body('amount').optional({ nullable: true }).isFloat({ min: 0 })
];

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw httpError(422, 'Validation failed', errors.array());
}

const activeList = asyncHandler(async (req, res) => {
  console.log('Worker ID filter:', req.session.user.role === 'Worker' ? req.session.user.workerId : null);
  
  const result = await query(req, `
    SELECT o.id, o.order_date, o.delivery_date, o.current_stage, o.status, c.name AS customer_name
    FROM Orders o
    INNER JOIN Customers c ON c.id = o.customer_id
    WHERE o.status <> 'Delivered'
    ORDER BY o.delivery_date, o.id;
  `, []);
  console.log('Query result count:', result.rows.length);
  
  // If no orders, return empty array
  if (result.rows.length === 0) {
    res.json({ data: [] });
    return;
  }
  
  // Get all stage completions in one query
  const orderIds = result.rows.map(o => o.id);
  const stagesResult = await query(req, `
    SELECT order_id,
           MAX(CAST(stage_booked AS int)) AS stage_booked,
           MAX(CAST(stage_cutting AS int)) AS stage_cutting,
           MAX(CAST(stage_stitching AS int)) AS stage_stitching,
           MAX(CAST(stage_trial AS int)) AS stage_trial,
           MAX(CAST(stage_alteration AS int)) AS stage_alteration,
           MAX(CAST(stage_pressing AS int)) AS stage_pressing,
           MAX(CAST(stage_ready AS int)) AS stage_ready,
           MAX(CAST(stage_delivered AS int)) AS stage_delivered
    FROM OrderItems
    WHERE order_id = ANY($1)
    GROUP BY order_id;
  `, [orderIds]);
  
  // Get all assignments in one query
  const assignmentsResult = await query(req, `
    SELECT wa.order_id, wa.stage, wa.completed_at, w.name AS worker_name, wa.worker_id AS assignment_worker_id
    FROM WorkAssignments wa
    LEFT JOIN Workers w ON w.id = wa.worker_id
    WHERE wa.order_id = ANY($1) AND wa.completed_at IS NULL
    ORDER BY wa.order_id, wa.assigned_at;
  `, [orderIds]);
  
  // Create maps for quick lookup
  const stagesMap = {};
  stagesResult.rows.forEach(row => {
    stagesMap[row.order_id] = row;
  });
  
  const assignmentsMap = {};
  assignmentsResult.rows.forEach(row => {
    if (!assignmentsMap[row.order_id]) {
      assignmentsMap[row.order_id] = row;
    }
  });
  
  const stageOrder = ['Booked', 'Cutting', 'Stitching', 'Trial', 'Alteration', 'Pressing', 'Ready', 'Delivered'];
  const stageColumns = ['stage_booked', 'stage_cutting', 'stage_stitching', 'stage_trial', 'stage_alteration', 'stage_pressing', 'stage_ready', 'stage_delivered'];
  
  const orders = result.rows.map(order => {
    const stageData = stagesMap[order.id];
    const assignmentData = assignmentsMap[order.id];
    
    const completed = [];
    if (stageData) {
      stageOrder.forEach((stage, index) => {
        if (stageData[stageColumns[index]]) {
          completed.push(stage);
        }
      });
    }
    
    return {
      ...order,
      completed_stages: completed,
      assigned_stage: assignmentData?.stage || null,
      completed_at: assignmentData?.completed_at || null,
      worker_name: assignmentData?.worker_name || null,
      assignment_worker_id: assignmentData?.assignment_worker_id || null
    };
  });
  
  res.json({ data: orders });
});

const toggleStage = asyncHandler(async (req, res) => {
  validate(req);
  const orderId = Number(req.body.order_id);
  const stage = req.body.stage;
  const completed = req.body.completed !== undefined ? Boolean(req.body.completed) : null;
  const [flagColumn, atColumn] = stageMap[stage];

  const data = await transaction(req, async (run) => {
    // Get current order state
    const order = await run('SELECT current_stage, balance FROM Orders WHERE id = $1;', [orderId]);
    if (!order.rows[0]) throw httpError(404, 'Order not found');
    
    const currentStage = order.rows[0].current_stage;
    const balance = order.rows[0].balance;
    const stageOrder = ['Booked', 'Cutting', 'Stitching', 'Trial', 'Alteration', 'Pressing', 'Ready', 'Delivered'];
    const targetStageIndex = stageOrder.indexOf(stage);
    const currentStageIndex = stageOrder.indexOf(currentStage);

    // Check if previous stages are completed (for both move and complete)
    if (targetStageIndex > 0) {
      const previousStage = stageOrder[targetStageIndex - 1];
      const [prevFlagColumn] = stageMap[previousStage];
      const previousCheck = await run(`
        SELECT ${prevFlagColumn} FROM OrderItems
        WHERE order_id = $1
        LIMIT 1;
      `, [orderId]);
      
      if (previousCheck.rows[0] && !previousCheck.rows[0][prevFlagColumn]) {
        throw httpError(400, `Previous stage (${previousStage}) must be completed first`);
      }
    }

    // Check if balance is paid before allowing delivery completion
    if (stage === 'Delivered' && completed === true && balance > 0) {
      throw httpError(400, 'Order cannot be delivered until the remaining balance is paid');
    }

    // Worker-specific checks
    if (req.session.user.role === 'Worker') {
      const assignment = await run(`
        SELECT id FROM WorkAssignments
        WHERE order_id = $1 AND worker_id = $2 AND stage = $3 AND completed_at IS NULL
        LIMIT 1;
      `, [orderId, req.session.user.workerId, stage]);
      if (!assignment.rows[0]) throw httpError(403, 'This stage is not assigned to you');
    }

    // If completed is provided, complete the stage
    if (completed !== null) {
      await run(`
        UPDATE OrderItems
        SET ${flagColumn} = $1, ${atColumn} = CASE WHEN $1 = true THEN NOW() ELSE NULL END
        WHERE order_id = $2;
      `, [completed, orderId]);

      await run(`
        UPDATE WorkAssignments
        SET completed_at = CASE WHEN $1 = true THEN NOW() ELSE NULL END
        WHERE order_id = $2 AND stage = $3
          AND ($4 IS NULL OR worker_id = $4);
      `, [completed, orderId, stage, req.session.user.role === 'Worker' ? req.session.user.workerId : null]);

      // Create worker earnings when stage is completed
      if (completed) {
        const assignments = await run(`
          SELECT wa.worker_id, wa.order_id
          FROM WorkAssignments wa
          WHERE wa.order_id = $1 AND wa.stage = $2 AND wa.completed_at IS NOT NULL;
        `, [orderId, stage]);

        const amount = Number(req.body.amount) || 0;

        // Only create worker earnings if amount is greater than 0
        if (amount > 0) {
          for (const assignment of assignments.rows) {
            const existingEarning = await run(`
              SELECT id FROM WorkerEarnings
              WHERE worker_id = $1 AND order_id = $2 AND stage = $3;
            `, [assignment.worker_id, assignment.order_id, stage]);

            if (!existingEarning.rows[0]) {
              await run(`
                INSERT INTO WorkerEarnings(worker_id, order_id, stage, amount)
                VALUES($1, $2, $3, $4);
              `, [assignment.worker_id, assignment.order_id, stage, amount]);
            }
          }
        }
      }
    } else {
      // Move to stage (update current_stage only)
      await run(`
        UPDATE Orders
        SET current_stage = $1
        WHERE id = $2;
      `, [stage, orderId]);
    }

    const updatedOrder = await run('SELECT id, current_stage, status FROM Orders WHERE id = $1;', [orderId]);
    return updatedOrder.rows[0];
  });

  res.json({ data });
});

module.exports = { toggleRules, activeList, toggleStage };
