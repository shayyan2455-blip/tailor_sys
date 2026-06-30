const sql = require('mssql');
const env = require('./env');

let poolPromise;

const config = {
  server: env.DB_SERVER,
  database: env.DB_NAME,
  port: env.DB_PORT,
  options: {
    encrypt: env.DB_ENCRYPT,
    trustServerCertificate: !env.DB_ENCRYPT,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

if (env.DB_USER) {
  config.user = env.DB_USER;
  config.password = env.DB_PASSWORD;
} else {
  config.options.trustedConnection = true;
}

function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(config);
  }
  return poolPromise;
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
  for (const [name, spec] of Object.entries(params)) {
    if (spec && typeof spec === 'object' && Object.prototype.hasOwnProperty.call(spec, 'type')) {
      request.input(name, spec.type, spec.value);
    } else {
      request.input(name, spec);
    }
  }
  return request;
}

function withSessionBatch(text) {
  return `
EXEC sp_set_session_context @key=N'user_id', @value=@__ctx_user_id;
EXEC sp_set_session_context @key=N'role', @value=@__ctx_role;
EXEC sp_set_session_context @key=N'worker_id', @value=@__ctx_worker_id;
${text}`;
}

async function query(req, text, params = {}) {
  const pool = await getPool();
  const ctx = contextFromReq(req);
  const request = pool.request();
  request.input('__ctx_user_id', sql.Int, ctx.userId);
  request.input('__ctx_role', sql.NVarChar(20), ctx.role);
  request.input('__ctx_worker_id', sql.Int, ctx.workerId);
  applyInputs(request, params);
  return request.query(withSessionBatch(text));
}

async function transaction(req, work) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    const run = async (text, params = {}) => {
      const ctx = contextFromReq(req);
      const request = new sql.Request(tx);
      request.input('__ctx_user_id', sql.Int, ctx.userId);
      request.input('__ctx_role', sql.NVarChar(20), ctx.role);
      request.input('__ctx_worker_id', sql.Int, ctx.workerId);
      applyInputs(request, params);
      return request.query(withSessionBatch(text));
    };
    const result = await work(run, tx);
    await tx.commit();
    return result;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

async function setSessionContext(req, context = {}) {
  const pool = await getPool();
  const request = pool.request();
  const user = { ...contextFromReq(req), ...context };
  request.input('__ctx_user_id', sql.Int, user.userId || null);
  request.input('__ctx_role', sql.NVarChar(20), user.role || null);
  request.input('__ctx_worker_id', sql.Int, user.workerId || null);
  return request.query(withSessionBatch('SELECT 1 AS ok;'));
}

module.exports = {
  sql,
  getPool,
  query,
  transaction,
  setSessionContext
};
