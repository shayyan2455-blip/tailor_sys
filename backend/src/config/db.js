const { Pool } = require('pg');
const env = require('./env');

let pool;

function valuesFromParams(params = {}) {
  if (Array.isArray(params)) {
    return params;
  }

  return Object.values(params);
}

const usesRemotePostgres = env.DATABASE_URL || !['localhost', '127.0.0.1'].includes(env.DB_HOST);
const ssl = env.DB_SSL || (env.NODE_ENV === 'production' && usesRemotePostgres)
  ? { rejectUnauthorized: false }
  : undefined;

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
  ssl,
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
  return pool.query(text, valuesFromParams(params));
}

async function transaction(req, work) {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const ctx = contextFromReq(req);
    const run = async (text, params = {}) => {
      await client.query(
        'SELECT set_config($1, $2, true), set_config($3, $4, true), set_config($5, $6, true);',
        [
          'app.current_user_id',
          ctx.userId ? String(ctx.userId) : '',
          'app.current_role',
          ctx.role || '',
          'app.current_worker_id',
          ctx.workerId ? String(ctx.workerId) : ''
        ]
      );

      return client.query(text, valuesFromParams(params));
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
    'SELECT set_config($1, $2, true), set_config($3, $4, true), set_config($5, $6, true);',
    [
      'app.current_user_id',
      user.userId ? String(user.userId) : '',
      'app.current_role',
      user.role || '',
      'app.current_worker_id',
      user.workerId ? String(user.workerId) : ''
    ]
  );
}

module.exports = {
  pg: require('pg'),
  getPool,
  query,
  transaction,
  setSessionContext
};
