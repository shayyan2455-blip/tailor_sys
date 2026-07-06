# API Rate Limiting Setup Guide

## Overview

API rate limiting has been implemented to protect against abuse and ensure fair usage:
- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP (strict)
- **Write operations**: 30 requests per minute per IP
- **Sensitive operations**: 10 requests per hour per IP

## Rate Limiting Configuration

### Rate Limiters Implemented

1. **General Limiter** (`generalLimiter`)
   - Applied to all `/api` routes
   - 100 requests per 15 minutes
   - Prevents general API abuse

2. **Auth Limiter** (`authLimiter`)
   - Applied to `/api/v1/auth` routes
   - 5 requests per 15 minutes
   - Protects against brute force attacks

3. **Write Limiter** (`writeLimiter`)
   - Applied to data modification routes (customers, workers, orders, payments, etc.)
   - 30 requests per minute
   - Prevents rapid data changes

4. **Strict Limiter** (`strictLimiter`)
   - Applied to sensitive operations (assignments)
   - 10 requests per hour
   - Extra protection for critical operations

### Rate Limit Response

When rate limit is exceeded, the API returns:
```json
{
  "error": "Too many requests from this IP, please try again later.",
  "retryAfter": 900
}
```

HTTP Status: 429 (Too Many Requests)

Headers included:
- `RateLimit-Limit`: Maximum requests per window
- `RateLimit-Remaining`: Remaining requests in current window
- `RateLimit-Reset`: Unix timestamp when window resets

## Configuration

### Environment Variables

Rate limiting is controlled by the `NODE_ENV` variable:

```bash
NODE_ENV=development  # Rate limiting enabled (in-memory)
NODE_ENV=production   # Rate limiting disabled (Vercel handles it)
```

**Note:** Rate limiting is automatically disabled on Vercel production deployments because Vercel has built-in rate limiting and IP-based limits are unreliable behind serverless proxies.

### Customizing Rate Limits

Edit `backend/src/middleware/rateLimiter.js`:

```javascript
// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Adjust as needed
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Adjust for security vs usability balance
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

## Route-Specific Rate Limits

Current configuration in `backend/src/app.js`:

```javascript
// Authentication (strictest)
app.use('/api/v1/auth', authLimiter, authRoutes);

// Data modification (write operations)
app.use('/api/v1/customers', writeLimiter, customerRoutes);
app.use('/api/v1/customer-measurements', writeLimiter, customerMeasurementRoutes);
app.use('/api/v1/customer-payments', writeLimiter, customerPaymentRoutes);
app.use('/api/v1/workers', writeLimiter, workerRoutes);
app.use('/api/v1/worker-payments', writeLimiter, workerPaymentRoutes);
app.use('/api/v1/designs', writeLimiter, designRoutes);
app.use('/api/v1/fabrics', writeLimiter, fabricRoutes);
app.use('/api/v1/orders', writeLimiter, orderRoutes);
app.use('/api/v1/payments', writeLimiter, paymentRoutes);
app.use('/api/v1/expenses', writeLimiter, expenseRoutes);

// Sensitive operations (strict)
app.use('/api/v1/assignments', strictLimiter, assignmentRoutes);

// Read-only operations (general limit)
app.use('/api/v1/production', productionRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/utility', utilityRoutes);
```

## Testing Rate Limiting

### Test with curl

```bash
# Test general rate limiting
for i in {1..110}; do
  curl -X GET http://localhost:4000/api/health
  echo "Request $i"
done

# Test auth rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:4000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}'
  echo "Request $i"
done
```

### Test with Postman

1. Create a collection with multiple requests
2. Use Postman's "Run Collection" feature
3. Set iterations to exceed rate limit
4. Observe 429 responses

### Monitor Rate Limit Headers

```bash
curl -I http://localhost:4000/api/health
```

Response headers:
```
HTTP/1.1 200 OK
RateLimit-Limit: 100
RateLimit-Remaining: 99
RateLimit-Reset: 1625097600
```

## Production Considerations

### Vercel Deployment

Rate limiting is automatically disabled on Vercel because:
- Vercel has built-in rate limiting
- IP-based limits are unreliable behind serverless proxies
- Vercel's edge network provides better protection

### Alternative: Redis-based Rate Limiting

For production deployments outside Vercel, consider Redis-based rate limiting:

```javascript
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

const redisLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate_limit:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

### Cloudflare Rate Limiting

If using Cloudflare, configure rate limiting rules:
1. Go to Cloudflare Dashboard → Security → WAF → Rate Limiting Rules
2. Create rules for:
   - API endpoints: 100 requests per 15 minutes
   - Auth endpoints: 5 requests per 15 minutes
3. Set appropriate actions (block, challenge, log only)

## Monitoring Rate Limits

### Log Rate Limit Violations

Rate limit violations are automatically logged by the application. Monitor logs for:
- Frequent 429 responses
- Specific IPs hitting limits
- Patterns of abuse

### Metrics to Track

- **Rate limit hit rate**: Percentage of requests blocked
- **Top offending IPs**: IPs most frequently blocked
- **Endpoint-specific limits**: Which endpoints hit limits most
- **Time-based patterns**: When rate limits are hit

## Troubleshooting

**Issue: Legitimate users blocked by rate limit**
- Solution: Increase limits for specific endpoints
- Consider user-based rate limiting instead of IP-based
- Implement whitelisting for trusted IPs

**Issue: Rate limit not working in production**
- Solution: Check NODE_ENV setting
- Verify Vercel deployment (rate limiting disabled by design)
- Consider Cloudflare or Redis-based rate limiting

**Issue: Rate limit headers not showing**
- Solution: Ensure `standardHeaders: true` is set
- Check if reverse proxy is stripping headers
- Verify middleware order in app.js

**Issue: Different limits needed per user role**
- Solution: Implement custom rate limiting middleware
- Check user role and apply different limits
- Example: Admins get higher limits than regular users

## Best Practices

1. **Set appropriate limits** - Balance security vs usability
2. **Monitor violations** - Track rate limit hits and adjust
3. **Use different limits for different operations** - Auth stricter than reads
4. **Provide clear error messages** - Tell users when they can retry
5. **Log violations** - Track potential abuse patterns
6. **Consider user-based limits** - For authenticated users
7. **Test before production** - Verify limits work as expected
8. **Document limits** - Inform API users of rate limits

## Security Benefits

- **Prevents brute force attacks** - On authentication endpoints
- **Prevents API abuse** - Limits automated requests
- **Protects against DoS** - Mitigates denial of service attempts
- **Ensures fair usage** - Prevents single users from monopolizing resources
- **Reduces database load** - Limits excessive database queries

## Next Steps

1. ✅ Rate limiting middleware created
2. ✅ Rate limiters applied to routes
3. ✅ Documentation created
4. ⏳ Test rate limiting in development
5. ⏳ Monitor rate limit violations in production
6. ⏳ Adjust limits based on usage patterns
7. ⏳ Consider Redis-based rate limiting for non-Vercel deployments
8. ⏳ Set up Cloudflare rate limiting rules (if using Cloudflare)
