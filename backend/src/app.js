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

// Redis session store (required for production)
let sessionStore;
let sessionStoreName = 'memory';
if (env.REDIS_URL || env.REDIS_HOST) {
  try {
    const { RedisStore } = require('connect-redis');
    const redis = require('redis');
    const redisUrl = env.REDIS_URL || `${env.REDIS_TLS ? 'rediss' : 'redis'}://:${env.REDIS_PASSWORD}@${env.REDIS_HOST}:${env.REDIS_PORT}/${env.REDIS_DB}`;
    const redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 10000,
        commandTimeout: 10000,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis reconnection failed after 10 attempts');
            return new Error('Redis reconnection failed');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis reconnecting...');
    });

    redisClient.connect().then(() => {
      sessionStore = new RedisStore({ client: redisClient });
      sessionStoreName = 'redis';
      logger.info('Using Redis for session storage');
    }).catch((err) => {
      logger.error('Failed to connect to Redis:', err);
      throw err;
    });
  } catch (err) {
    logger.error('Redis configuration failed:', err);
    throw err;
  }
} else {
  logger.error('Redis not configured - Redis is required for session storage in production');
  if (env.NODE_ENV === 'production') {
    throw new Error('Redis is required for production deployment');
  }
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
const isVercel = Boolean(process.env.VERCEL);
const rateLimitEnabled = env.NODE_ENV !== 'production' && !isVercel;

// Trust proxy for Vercel serverless environment (only trust specific proxies)
app.set('trust proxy', 1);

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
  skip: (req) => {
    // IP-based in-memory rate limits are unreliable behind serverless proxies.
    return !rateLimitEnabled;
  }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // IP-based in-memory rate limits are unreliable behind serverless proxies.
    return !rateLimitEnabled;
  }
});

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(session({
  name: env.COOKIE_NAME,
  secret: env.SESSION_SECRET,
  proxy: env.NODE_ENV === 'production',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
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
  if (req.path.startsWith('/v1/auth') || req.path === '/auth' || req.path === '/health') {
    return next();
  }
  return csrfProtection(req, res, next);
});

app.get('/api/health', (_req, res) => res.json({
  data: {
    ok: true,
    sessionStore: sessionStoreName,
    redisConfigured: Boolean(env.REDIS_URL || env.REDIS_HOST),
    rateLimitEnabled
  }
}));

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
