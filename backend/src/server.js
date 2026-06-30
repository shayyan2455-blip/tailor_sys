const app = require('./app');
const env = require('./config/env');
const { getPool } = require('./config/db');

const server = app.listen(env.PORT, () => {
  console.log(`Tailor ERP API listening on port ${env.PORT}`);
});

async function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    try {
      const pool = await getPool();
      await pool.close();
    } catch (_error) {
      // Pool may not have been opened yet.
    }
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
