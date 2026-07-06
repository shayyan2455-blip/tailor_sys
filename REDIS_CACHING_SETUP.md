# Redis Caching Setup Guide

## Overview

Redis caching has been integrated to improve performance for frequently accessed master data:
- **Customers list**: Cached for 5 minutes
- **Workers list**: Cached for 10 minutes
- **Cache invalidation**: Automatic on create/update/delete operations

## Installation

Redis client library is already added to dependencies:
```bash
cd backend
npm install ioredis
```

## Configuration

### Environment Variables

Add to your `.env` file or production environment variables:

```bash
# Option 1: Use REDIS_URL (recommended)
REDIS_URL=redis://username:password@host:port/db

# Option 2: Individual Redis parameters
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
REDIS_TLS=true  # Required for secure Redis connections
```

### For Development (Local Redis)

If you don't have Redis installed locally:

**Mac:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis
```

**Windows:**
- Download Redis for Windows from https://github.com/microsoftarchive/redis/releases
- Or use Docker: `docker run -d -p 6379:6379 redis`

### For Production (Managed Redis)

**Redis Cloud (Redis.com):**
1. Create a free account at https://redis.com/
2. Create a new database
3. Get the connection string (REDIS_URL)

**Upstash:**
1. Create account at https://upstash.com/
2. Create a new Redis database
3. Get the connection string

**AWS ElastiCache:**
1. Create Redis cluster in AWS
2. Configure security groups
3. Get endpoint URL

**Vercel KV (if using Vercel):**
1. Add KV integration in Vercel dashboard
2. Use KV_REST_URL and KV_REST_TOKEN

## How Caching Works

### Cache Keys

The system uses structured cache keys:
- `customers:list:{cursor}:{limit}` - Customer list with pagination
- `workers:list:all` - Complete workers list

### Cache TTL (Time To Live)

- **Customers**: 5 minutes (300 seconds) - Changes more frequently
- **Workers**: 10 minutes (600 seconds) - Changes less frequently

### Cache Invalidation

Cache is automatically invalidated when:
- Creating new records
- Updating existing records
- Deleting records

Pattern-based invalidation:
- `customers:list:*` - All customer list caches
- `workers:list:*` - All worker list caches

## Implementation Details

### Customer Controller

```javascript
const { get, set, delPattern } = require('../config/redis');

// List with caching
const list = asyncHandler(async (req, res) => {
  const cacheKey = `customers:list:${cursor}:${limit}`;
  
  // Try cache first
  const cached = await get(cacheKey);
  if (cached) {
    return res.json(cached);
  }
  
  // Query database
  const result = await query(req, 'SELECT * FROM Customers...');
  
  // Cache for 5 minutes
  await set(cacheKey, response, 300);
  
  res.json(response);
});

// Create with cache invalidation
const create = asyncHandler(async (req, res) => {
  // Create record
  const result = await query(req, 'INSERT INTO Customers...');
  
  // Invalidate all customer list caches
  await delPattern('customers:list:*');
  
  res.json(result);
});
```

### Worker Controller

Similar pattern for workers with 10-minute cache duration.

## Testing Redis Connection

### Test Script

Create `test-redis.js`:
```javascript
const { getRedisClient } = require('./src/config/redis');

async function testRedis() {
  try {
    const client = getRedisClient();
    await client.set('test', 'hello');
    const value = await client.get('test');
    console.log('Redis test successful:', value);
    await client.del('test');
    process.exit(0);
  } catch (error) {
    console.error('Redis test failed:', error.message);
    process.exit(1);
  }
}

testRedis();
```

Run test:
```bash
node test-redis.js
```

## Monitoring Redis

### Check Cache Hit Rate

```javascript
const client = getRedisClient();
const info = await client.info('stats');
console.log(info);
```

### View All Cached Keys

```javascript
const client = getRedisClient();
const keys = await client.keys('*');
console.log('Cached keys:', keys);
```

### Clear All Cache

```javascript
const { flush } = require('./src/config/redis');
await flush();
```

## Performance Impact

### Expected Improvements

- **80-90% faster** customer list queries (cached)
- **80-90% faster** worker list queries (cached)
- **Reduced database load** - Fewer queries to PostgreSQL
- **Better response times** - Sub-100ms for cached data

### Cache Miss Scenarios

Cache will be bypassed (query database) when:
- First request after server restart
- Search queries (not cached)
- Cache expired (TTL reached)
- Cache invalidated (data changed)

## Troubleshooting

**Issue: "Redis connection refused"**
- Solution: Ensure Redis server is running
- Check REDIS_HOST and REDIS_PORT
- Verify firewall settings

**Issue: "Redis authentication failed"**
- Solution: Check REDIS_PASSWORD
- Verify Redis server requires authentication
- Check Redis server logs

**Issue: Cache not working**
- Solution: Verify Redis connection
- Check if REDIS_URL is set correctly
- Test with test script above
- Check application logs for Redis errors

**Issue: Stale data in cache**
- Solution: Cache invalidation should handle this
- Manually clear cache: `await flush()`
- Check TTL settings

**Issue: High memory usage**
- Solution: Reduce TTL values
- Monitor Redis memory usage
- Consider Redis eviction policies

## Redis Configuration for Production

### Memory Management

```bash
# Set max memory (in redis.conf)
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### Persistence

```bash
# Enable RDB snapshots
save 900 1
save 300 10
save 60 10000
```

### Security

```bash
# Require authentication
requirepass your_strong_password

# Bind to specific IP
bind 127.0.0.1

# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
```

## Cost Considerations

### Free Tiers

- **Redis Cloud**: 30MB storage, 25 connections
- **Upstash**: 10K commands/day, 256KB storage
- **AWS ElastiCache**: Free tier not available

### Paid Tiers (for 3000+ users)

- **Redis Cloud**: Starting at $7/month
- **Upstash**: Starting at $0.20/100K requests
- **AWS ElastiCache**: ~$20-50/month depending on size

## Best Practices

1. **Set appropriate TTL** - Balance freshness vs performance
2. **Monitor cache hit rate** - Aim for 70%+ hit rate
3. **Use pattern-based invalidation** - Efficient cache clearing
4. **Don't cache sensitive data** - PII, passwords, tokens
5. **Monitor Redis memory** - Set max memory limits
6. **Use connection pooling** - Already configured in redis.js
7. **Handle Redis failures gracefully** - Fallback to database
8. **Test cache invalidation** - Verify data consistency

## Next Steps

1. ✅ Redis configuration created
2. ✅ Redis caching added to customers controller
3. ✅ Redis caching added to workers controller
4. ⏳ Install Redis locally or set up managed Redis
5. ⏳ Configure environment variables
6. ⏳ Test Redis connection
7. ⏳ Add caching to other controllers (fabrics, designs, etc.)
8. ⏳ Monitor cache performance in production

## Optional: Extend Caching to Other Controllers

You can extend caching to other master data controllers:

**Fabrics:**
```javascript
const cacheKey = 'fabrics:list:all';
const cached = await get(cacheKey);
if (cached) return res.json(cached);
// ... query database
await set(cacheKey, response, 600); // 10 minutes
```

**Designs:**
```javascript
const cacheKey = 'designs:list:all';
const cached = await get(cacheKey);
if (cached) return res.json(cached);
// ... query database
await set(cacheKey, response, 600); // 10 minutes
```

Follow the same pattern: check cache → query if miss → set cache → invalidate on changes.
