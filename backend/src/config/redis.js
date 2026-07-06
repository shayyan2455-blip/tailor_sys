const Redis = require('ioredis');
const env = require('./env');

let redisClient;

function getRedisClient() {
  if (!redisClient) {
    const redisConfig = {
      host: env.REDIS_HOST || 'localhost',
      port: env.REDIS_PORT || 6379,
      db: env.REDIS_DB || 0,
      password: env.REDIS_PASSWORD || undefined,
      tls: env.REDIS_TLS ? {} : undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    };

    if (env.REDIS_URL) {
      redisClient = new Redis(env.REDIS_URL, {
        tls: env.REDIS_TLS ? {} : undefined,
      });
    } else {
      redisClient = new Redis(redisConfig);
    }

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
    });

    redisClient.on('error', (error) => {
      console.error('❌ Redis error:', error.message);
    });

    redisClient.on('close', () => {
      console.log('⚠️ Redis connection closed');
    });
  }

  return redisClient;
}

async function get(key) {
  try {
    const client = getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis get error:', error.message);
    return null;
  }
}

async function set(key, value, ttl = 300) {
  try {
    const client = getRedisClient();
    await client.set(key, JSON.stringify(value), 'EX', ttl);
    return true;
  } catch (error) {
    console.error('Redis set error:', error.message);
    return false;
  }
}

async function del(key) {
  try {
    const client = getRedisClient();
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error.message);
    return false;
  }
}

async function delPattern(pattern) {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
    return true;
  } catch (error) {
    console.error('Redis delete pattern error:', error.message);
    return false;
  }
}

async function flush() {
  try {
    const client = getRedisClient();
    await client.flushdb();
    return true;
  } catch (error) {
    console.error('Redis flush error:', error.message);
    return false;
  }
}

module.exports = {
  getRedisClient,
  get,
  set,
  del,
  delPattern,
  flush
};
