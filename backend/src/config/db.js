const { Pool } = require('pg');
const env = require('./env');

let pool;

const config = {
  connectionString: env.DATABASE_URL,
  host: env.DB_HOST,
  database: env.DB_NAME,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

function getPool() {
  if (!pool) {
    pool = new Pool(config);
  }
  return pool;
}

function contextFromReq(req) {
  const user = req.session?.user;
  return {
    userId: user?.id || null,
    role: user?.role || null,
    workerId: user?.workerId || null
  };
}

function applyInputs(request, params = {}) {
  for (const [name, value] of Object.entries(params)) {
    request.values.push(value);
  }
  return request;
}

function withSessionBatch(text) {
  return `
SET LOCAL app.current_user_id = $1;
SET LOCAL app.current_role = $2;
SET LOCAL app.current_worker_id = $3;
${text}`;
}

async function query(req, text, params = {}) {
  const pool = getPool();
  const ctx = contextFromReq(req);
  const values = [ctx.userId, ctx.role, ctx.workerId];
  
  // Add params to values
  for (const [name, value] of Object.entries(params)) {
    values.push(value);
  }
  
  return pool.query(text, values);
}

async function transaction(req, work) {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const ctx = contextFromReq(req);
    const run = async (text, params = {}) => {
      const values = [ctx.userId, ctx.role, ctx.workerId];
      
      // Add params to values
      for (const [name, value] of Object.entries(params)) {
        values.push(value);
      }
      
      return client.query(text, values);
    };
    
    const result = await work(run, client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function setSessionContext(req, context = {}) {
  const pool = getPool();
  const user = { ...contextFromReq(req), ...context };
  return pool.query(
    'SET LOCAL app.current_user_id = $1, app.current_role = $2, app.current_worker_id = $3',
    [user.userId || null, user.role || null, user.workerId || null]
  );
}

module.exports = {
  pg: require('pg'),
  getPool,
  query,
  transaction,
  setSessionContext
};
