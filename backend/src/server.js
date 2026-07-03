const createApp = require('./app');
const env = require('./config/env');
const { getPool } = require('./config/db');
const cron = require('node-cron');
const { createBackup } = require('./utils/backup');
const logger = require('./utils/logger');

async function startServer() {
  const app = await createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`Tailor ERP API listening on port ${env.PORT}`);
  });

  // Schedule daily backup at 2 AM
  if (env.NODE_ENV === 'production') {
    cron.schedule('0 2 * * *', async () => {
      logger.info('Starting scheduled database backup...');
      try {
        await createBackup();
        logger.info('Scheduled backup completed successfully');
      } catch (error) {
        logger.error({ error }, 'Scheduled backup failed');
      }
    });
    logger.info('Scheduled daily database backup at 2:00 AM');
  }

  async function shutdown(signal) {
    logger.info(`${signal} received, shutting down`);
    server.close(async () => {
      try {
        const pool = await getPool();
        await pool.close();
      } catch (_error) {
        // Pool may not have been opened yet.
      }
      logger.info('Server shutdown complete');
      process.exit(0);
    });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch(err => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
