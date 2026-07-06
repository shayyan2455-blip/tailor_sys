// Error Monitoring and Handler Utility
// Supports multiple error monitoring services

class ErrorHandler {
  constructor() {
    this.service = process.env.ERROR_MONITORING_SERVICE || 'console'; // 'sentry', 'logrocket', 'console'
    this.initialized = false;
    this.init();
  }

  init() {
    if (this.service === 'sentry' && process.env.SENTRY_DSN) {
      this.initSentry();
    } else if (this.service === 'logrocket' && process.env.LOGROCKET_APP_ID) {
      this.initLogRocket();
    } else {
      console.log('Error monitoring: Using console logging (configure SENTRY_DSN or LOGROCKET_APP_ID for production)');
    }
    this.initialized = true;
  }

  initSentry() {
    try {
      const Sentry = require('@sentry/node');
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        beforeSend(event, hint) {
          // Filter out sensitive data
          if (event.request) {
            delete event.request.cookies;
            delete event.request.headers;
          }
          return event;
        }
      });
      console.log('✅ Sentry error monitoring initialized');
      this.Sentry = Sentry;
    } catch (error) {
      console.error('Failed to initialize Sentry:', error.message);
    }
  }

  initLogRocket() {
    try {
      const LogRocket = require('logrocket');
      LogRocket.init(process.env.LOGROCKET_APP_ID);
      console.log('✅ LogRocket error monitoring initialized');
      this.LogRocket = LogRocket;
    } catch (error) {
      console.error('Failed to initialize LogRocket:', error.message);
    }
  }

  captureError(error, context = {}) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };

    if (this.service === 'sentry' && this.Sentry) {
      this.Sentry.captureException(error, { extra: context });
    } else if (this.service === 'logrocket' && this.LogRocket) {
      this.LogRocket.captureException(error, { extra: context });
    }

    // Always log to console as fallback
    console.error('Error captured:', errorData);
  }

  captureMessage(message, level = 'info', context = {}) {
    const messageData = {
      message,
      level,
      context,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };

    if (this.service === 'sentry' && this.Sentry) {
      this.Sentry.captureMessage(message, { level, extra: context });
    }

    console.log(`[${level.toUpperCase()}] ${message}`, context);
  }

  setUser(user) {
    if (this.service === 'sentry' && this.Sentry) {
      this.Sentry.setUser({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      });
    } else if (this.service === 'logrocket' && this.LogRocket) {
      this.LogRocket.identify(user.id, {
        name: user.username,
        email: user.email,
        role: user.role
      });
    }
  }

  clearUser() {
    if (this.service === 'sentry' && this.Sentry) {
      this.Sentry.setUser(null);
    } else if (this.service === 'logrocket' && this.LogRocket) {
      this.LogRocket.identify(null);
    }
  }
}

// Export singleton instance
const errorHandler = new ErrorHandler();

module.exports = errorHandler;
