# Error Monitoring Setup Guide

## Overview

Error monitoring has been integrated into the application with support for:
- **Sentry** - Industry-standard error tracking
- **LogRocket** - Session replay and error monitoring
- **Console logging** - Fallback for development

## Installation

### Option 1: Sentry (Recommended for Production)

1. **Install Sentry:**
```bash
cd backend
npm install @sentry/node
```

2. **Create a Sentry account** at https://sentry.io/
3. **Create a new project** (Node.js/Express)
4. **Get your DSN** from Sentry project settings

### Option 2: LogRocket

1. **Install LogRocket:**
```bash
cd backend
npm install logrocket
```

2. **Create a LogRocket account** at https://logrocket.com/
3. **Create a new project**
4. **Get your App ID** from LogRocket dashboard

## Configuration

### Environment Variables

Add to your `.env` file or production environment variables:

```bash
# Choose your error monitoring service
ERROR_MONITORING_SERVICE=sentry  # Options: 'sentry', 'logrocket', 'console'

# Sentry Configuration
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# LogRocket Configuration
LOGROCKET_APP_ID=your-logrocket-app-id
```

### For Vercel Deployment

Add these environment variables in Vercel dashboard:
- Settings → Environment Variables
- Add `ERROR_MONITORING_SERVICE`, `SENTRY_DSN` or `LOGROCKET_APP_ID`

## Integration

The error handler is already integrated at `backend/src/utils/errorHandler.js`.

### Using in Your Code

```javascript
const errorHandler = require('./utils/errorHandler');

// Capture errors
try {
  // Your code
} catch (error) {
  errorHandler.captureError(error, {
    userId: req.session.user?.id,
    action: 'create_order',
    orderId: orderId
  });
}

// Capture messages
errorHandler.captureMessage('User logged in', 'info', {
  userId: user.id,
  role: user.role
});

// Set user context
errorHandler.setUser({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role
});

// Clear user context on logout
errorHandler.clearUser();
```

### Global Error Handling

Add to your main app file (usually `app.js` or `server.js`):

```javascript
const errorHandler = require('./src/utils/errorHandler');

// Global error handler
app.use((err, req, res, next) => {
  errorHandler.captureError(err, {
    path: req.path,
    method: req.method,
    userId: req.session.user?.id
  });
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  errorHandler.captureError(error, { type: 'uncaughtException' });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  errorHandler.captureError(reason, { type: 'unhandledRejection' });
});
```

## Sentry-Specific Configuration

### Performance Monitoring

Enable performance monitoring in Sentry:

```javascript
// In errorHandler.js, modify initSentry:
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
  ],
});
```

### Release Tracking

Track deployments in Sentry:

```bash
# Set release version
SENTRY_RELEASE=v1.0.0

# Or in your deployment script:
export SENTRY_RELEASE=$(git rev-parse --short HEAD)
```

### Alerting

Configure Sentry alerts:
1. Go to Sentry project → Settings → Alerts
2. Set up alerts for:
   - New errors
   - Error rate increases
   - Performance degradation
3. Configure notification channels (email, Slack, etc.)

## LogRocket-Specific Configuration

### Session Recording

LogRocket automatically records sessions. Configure what to record:

```javascript
// In errorHandler.js, modify initLogRocket:
LogRocket.init(process.env.LOGROCKET_APP_ID, {
  network: {
    requestSanitizer: (request) => {
      // Remove sensitive headers
      delete request.headers['authorization'];
      delete request.headers['cookie'];
      return request;
    },
    responseSanitizer: (response) => {
      // Remove sensitive response data
      return response;
    },
  },
});
```

### Console Recording

LogRocket can record console logs:

```javascript
LogRocket.init(process.env.LOGROCKET_APP_ID, {
  console: {
    shouldAggregateConsoleReportErrors: true,
  },
});
```

## Testing Error Monitoring

### Test Sentry Integration

```javascript
// Add a test endpoint
app.get('/test-sentry', (req, res) => {
  const errorHandler = require('./src/utils/errorHandler');
  errorHandler.captureError(new Error('Test error from Sentry'), {
    test: true,
    timestamp: new Date()
  });
  res.send('Error sent to Sentry');
});
```

### Test LogRocket Integration

```javascript
// Add a test endpoint
app.get('/test-logrocket', (req, res) => {
  const errorHandler = require('./src/utils/errorHandler');
  errorHandler.captureMessage('Test message from LogRocket', 'info', {
    test: true
  });
  res.send('Message sent to LogRocket');
});
```

## Best Practices

1. **Set user context** - Always identify users when errors occur
2. **Add context** - Include relevant data (action, IDs, etc.)
3. **Filter sensitive data** - Don't log passwords, tokens, etc.
4. **Use appropriate levels** - info, warning, error for different severity
5. **Monitor error rates** - Set up alerts for unusual patterns
6. **Review regularly** - Check error dashboards weekly
7. **Fix critical errors** - Prioritize errors affecting many users

## Cost Comparison

### Sentry
- **Free tier:** 5,000 errors/month
- **Developer:** $26/month (50,000 errors)
- **Team:** $80/month (400,000 errors)
- **Best for:** Comprehensive error tracking, performance monitoring

### LogRocket
- **Free tier:** 1,000 sessions/month
- **Growth:** $99/month (10,000 sessions)
- **Scale:** $299/month (100,000 sessions)
- **Best for:** Session replay, user behavior analysis

## Recommendations

**For 3000+ users:**
- Use **Sentry** for error tracking (more cost-effective for high volume)
- Consider **LogRocket** if you need session replay (more expensive)
- Start with Sentry, add LogRocket if needed for debugging

**For development:**
- Use console logging (default)
- Add Sentry for staging environment
- Full monitoring for production

## Troubleshooting

**Issue: "Sentry DSN not configured"**
- Solution: Set SENTRY_DSN environment variable
- Verify DSN format: `https://key@sentry.io/project-id`

**Issue: "LogRocket not capturing errors"**
- Solution: Ensure LOGROCKET_APP_ID is set
- Check browser console for initialization errors

**Issue: Too many errors in development**
- Solution: Set ERROR_MONITORING_SERVICE=console in development
- Use Sentry only in staging/production

## Next Steps

1. ✅ Error handler utility created
2. ⏳ Install chosen monitoring service (Sentry or LogRocket)
3. ⏳ Configure environment variables
4. ⏳ Integrate into main application file
5. ⏳ Test error capture
6. ⏳ Set up alerts and notifications
