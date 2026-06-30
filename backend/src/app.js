const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const env = require('./config/env');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
const workerRoutes = require('./routes/worker.routes');
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

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(session({
  name: env.COOKIE_NAME,
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 1000 * 60 * 60 * 10
  }
}));

app.get('/api/health', (_req, res) => res.json({ data: { ok: true } }));
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/fabrics', fabricRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/utility', utilityRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
