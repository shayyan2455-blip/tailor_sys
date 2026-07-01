const { query } = require('../config/db');
const { sql } = require('../config/db');
const logger = require('./logger');

/**
 * Archive completed orders older than specified days
 */
async function archiveCompletedOrders(daysOld = 365) {
  try {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    // Find orders to archive (delivered and older than cutoff)
    const ordersToArchive = await query(null, `
      SELECT id, customer_id, order_date, delivery_date, current_stage, status, 
             total_amount, paid_amount, balance, notes
      FROM dbo.Orders
      WHERE status = 'Delivered' 
        AND delivery_date < @cutoffDate;
    `, { cutoffDate: { type: sql.DateTime, value: cutoffDate } });
    
    if (ordersToArchive.recordset.length === 0) {
      logger.info('No orders to archive');
      return { archived: 0 };
    }
    
    // Insert into archive table
    for (const order of ordersToArchive.recordset) {
      await query(null, `
        INSERT INTO dbo.Orders_Archive (id, customer_id, order_date, delivery_date, current_stage, status, total_amount, paid_amount, balance, notes)
        VALUES (@id, @customer_id, @order_date, @delivery_date, @current_stage, @status, @total_amount, @paid_amount, @balance, @notes);
      `, {
        id: { type: sql.Int, value: order.id },
        customer_id: { type: sql.Int, value: order.customer_id },
        order_date: { type: sql.DateTime, value: order.order_date },
        delivery_date: { type: sql.DateTime, value: order.delivery_date },
        current_stage: { type: sql.NVarChar(50), value: order.current_stage },
        status: { type: sql.NVarChar(20), value: order.status },
        total_amount: { type: sql.Decimal(18, 2), value: order.total_amount },
        paid_amount: { type: sql.Decimal(18, 2), value: order.paid_amount },
        balance: { type: sql.Decimal(18, 2), value: order.balance },
        notes: { type: sql.NVarChar(sql.MAX), value: order.notes }
      });
    }
    
    // Delete from main table
    const orderIds = ordersToArchive.recordset.map(o => o.id);
    await query(null, `
      DELETE FROM dbo.Orders
      WHERE id IN (${orderIds.map(() => '?').join(',')});
    `, orderIds.map(id => ({ type: sql.Int, value: id })));
    
    logger.info(`Archived ${ordersToArchive.recordset.length} orders`);
    return { archived: ordersToArchive.recordset.length };
  } catch (error) {
    logger.error({ error }, 'Error archiving orders');
    throw error;
  }
}

/**
 * Archive payments older than specified days
 */
async function archivePayments(daysOld = 365) {
  try {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    const paymentsToArchive = await query(null, `
      SELECT id, order_id, amount, payment_date, payment_method, notes
      FROM dbo.Payments
      WHERE payment_date < @cutoffDate;
    `, { cutoffDate: { type: sql.DateTime, value: cutoffDate } });
    
    if (paymentsToArchive.recordset.length === 0) {
      logger.info('No payments to archive');
      return { archived: 0 };
    }
    
    for (const payment of paymentsToArchive.recordset) {
      await query(null, `
        INSERT INTO dbo.Payments_Archive (id, order_id, amount, payment_date, payment_method, notes)
        VALUES (@id, @order_id, @amount, @payment_date, @payment_method, @notes);
      `, {
        id: { type: sql.Int, value: payment.id },
        order_id: { type: sql.Int, value: payment.order_id },
        amount: { type: sql.Decimal(18, 2), value: payment.amount },
        payment_date: { type: sql.DateTime, value: payment.payment_date },
        payment_method: { type: sql.NVarChar(50), value: payment.payment_method },
        notes: { type: sql.NVarChar(sql.MAX), value: payment.notes }
      });
    }
    
    const paymentIds = paymentsToArchive.recordset.map(p => p.id);
    await query(null, `
      DELETE FROM dbo.Payments
      WHERE id IN (${paymentIds.map(() => '?').join(',')});
    `, paymentIds.map(id => ({ type: sql.Int, value: id })));
    
    logger.info(`Archived ${paymentsToArchive.recordset.length} payments`);
    return { archived: paymentsToArchive.recordset.length };
  } catch (error) {
    logger.error({ error }, 'Error archiving payments');
    throw error;
  }
}

/**
 * Archive expenses older than specified days
 */
async function archiveExpenses(daysOld = 365) {
  try {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    const expensesToArchive = await query(null, `
      SELECT id, description, amount, expense_date, category, notes
      FROM dbo.Expenses
      WHERE expense_date < @cutoffDate;
    `, { cutoffDate: { type: sql.DateTime, value: cutoffDate } });
    
    if (expensesToArchive.recordset.length === 0) {
      logger.info('No expenses to archive');
      return { archived: 0 };
    }
    
    for (const expense of expensesToArchive.recordset) {
      await query(null, `
        INSERT INTO dbo.Expenses_Archive (id, description, amount, expense_date, category, notes)
        VALUES (@id, @description, @amount, @expense_date, @category, @notes);
      `, {
        id: { type: sql.Int, value: expense.id },
        description: { type: sql.NVarChar(255), value: expense.description },
        amount: { type: sql.Decimal(18, 2), value: expense.amount },
        expense_date: { type: sql.DateTime, value: expense.expense_date },
        category: { type: sql.NVarChar(100), value: expense.category },
        notes: { type: sql.NVarChar(sql.MAX), value: expense.notes }
      });
    }
    
    const expenseIds = expensesToArchive.recordset.map(e => e.id);
    await query(null, `
      DELETE FROM dbo.Expenses
      WHERE id IN (${expenseIds.map(() => '?').join(',')});
    `, expenseIds.map(id => ({ type: sql.Int, value: id })));
    
    logger.info(`Archived ${expensesToArchive.recordset.length} expenses`);
    return { archived: expensesToArchive.recordset.length };
  } catch (error) {
    logger.error({ error }, 'Error archiving expenses');
    throw error;
  }
}

/**
 * Run all archiving tasks
 */
async function runArchiveTasks(daysOld = 365) {
  logger.info('Starting data archiving tasks');
  
  try {
    const results = {
      orders: await archiveCompletedOrders(daysOld),
      payments: await archivePayments(daysOld),
      expenses: await archiveExpenses(daysOld)
    };
    
    logger.info('Data archiving completed', results);
    return results;
  } catch (error) {
    logger.error({ error }, 'Data archiving failed');
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const daysOld = parseInt(process.argv[2]) || 365;
  runArchiveTasks(daysOld)
    .then(() => {
      logger.info('Archive process completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Archive process failed:', error);
      process.exit(1);
    });
}

module.exports = {
  archiveCompletedOrders,
  archivePayments,
  archiveExpenses,
  runArchiveTasks
};
