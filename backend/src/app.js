const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const { notFound, errorHandler } = require('./middleware/error.middleware');
const { csrfProtection } = require('./middleware/csrf.middleware');
const logger = require('./utils/logger');

// Redis session store (optional - falls back to memory store if not configured)
let sessionStore;
if (env.REDIS_HOST) {
  try {
    const RedisStore = require('connect-redis').default;
    const redis = require('redis');
    const redisClient = redis.createClient({
      url: `redis://:${env.REDIS_PASSWORD}@${env.REDIS_HOST}:${env.REDIS_PORT}/${env.REDIS_DB}`
    });

    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    redisClient.connect().catch((err) => {
      console.error('Failed to connect to Redis, falling back to memory store:', err);
    });

    sessionStore = RedisStore({ client: redisClient });
    logger.info('Using Redis for session storage');
  } catch (err) {
    logger.warn('Redis configuration failed, using memory store:', err.message);
  }
} else {
  logger.warn('Redis not configured, using memory store for sessions (not recommended for production)');
}

const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
const customerMeasurementRoutes = require('./routes/customerMeasurement.routes');
const workerRoutes = require('./routes/worker.routes');
const workerPaymentRoutes = require('./routes/workerPayment.routes');
const designRoutes = require('./routes/design.routes');
const fabricRoutes = require('./routes/fabric.routes');
const orderRoutes = require('./routes/order.routes');
const productionRoutes = require('./routes/production.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const paymentRoutes = require('./routes/payment.routes');
const expenseRoutes = require('./routes/expense.routes');
const reportRoutes = require('./routes/report.routes');
const utilityRoutes = require('./routes/utility.routes');

const app = express();
app.locals.cookieName = env.COOKIE_NAME;

// Trust proxy for Vercel serverless environment
app.set('trust proxy', true);

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  frameguard: { action: 'deny' }
}));

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}));

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(session({
  name: env.COOKIE_NAME,
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 1000 * 60 * 30, // 30 minutes
    path: '/'
  }
}));
app.use((req, res, next) => {
  if (env.NODE_ENV !== 'production') {
    logger.debug({ method: req.method, path: req.path, sessionId: req.sessionID, user: req.session?.user, cookies: req.cookies }, 'Request received');
  }
  next();
});

app.use(generalLimiter);

// CSRF protection (skip for auth endpoints which have their own rate limiting)
app.use('/api', (req, res, next) => {
  // Skip CSRF for auth endpoints, health check, and public endpoints
  if (req.path.startsWith('/api/auth') || req.path === '/api/health') {
    return next();
  }
  return csrfProtection(req, res, next);
});

app.get('/api/health', (_req, res) => res.json({ data: { ok: true } }));

// API v1 routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/customer-measurements', customerMeasurementRoutes);
app.use('/api/v1/workers', workerRoutes);
app.use('/api/v1/worker-payments', workerPaymentRoutes);
app.use('/api/v1/designs', designRoutes);
app.use('/api/v1/fabrics', fabricRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/production', productionRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/utility', utilityRoutes);

// Legacy routes (redirect to v1)
app.use('/api/auth', (req, res, next) => {
  req.url = req.url.replace('/api/auth', '/api/v1/auth');
  app._router.handle(req, res, next);
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
