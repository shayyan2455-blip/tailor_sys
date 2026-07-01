const redis = require('redis');
const env = require('../config/env');

let redisClient;

function getRedisClient() {
  if (!redisClient && env.REDIS_HOST) {
    redisClient = redis.createClient({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      db: env.REDIS_DB
    });
    
    redisClient.on('error', (err) => {
      console.error('Redis cache error:', err);
    });
    
    redisClient.connect().catch((err) => {
      console.error('Failed to connect to Redis for caching:', err);
      redisClient = null;
    });
  }
  return redisClient;
}

/**
 * Cache middleware factory
 * @param {string} keyPrefix - Prefix for cache keys
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 */
function cacheMiddleware(keyPrefix, ttl = 300) {
  return async (req, res, next) => {
    const client = getRedisClient();
    if (!client) {
      return next(); // Skip caching if Redis not available
    }

    const cacheKey = `${keyPrefix}:${JSON.stringify(req.query)}`;
    
    try {
      // Try to get from cache
      const cached = await client.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function(data) {
        // Cache the response
        client.setEx(cacheKey, ttl, JSON.stringify(data)).catch((err) => {
          console.error('Cache set error:', err);
        });
        
        // Call original json method
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); // Continue without caching on error
    }
  };
}

/**
 * Invalidate cache by pattern
 */
async function invalidateCache(pattern) {
  const client = getRedisClient();
  if (!client) return;

  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

/**
 * Get cached value
 */
async function getCached(key) {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set cached value
 */
async function setCached(key, value, ttl = 300) {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

module.exports = {
  getRedisClient,
  cacheMiddleware,
  invalidateCache,
  getCached,
  setCached
};
