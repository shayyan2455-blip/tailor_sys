const pino = require('pino');
const env = require('../config/env');

const logLevel = env.NODE_ENV === 'production' ? 'info' : 'debug';

const logger = pino({
  level: logLevel,
  transport: env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname'
    }
  } : undefined,
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

module.exports = logger;
