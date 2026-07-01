# Redis Session Storage Configuration

## Overview
This application supports Redis for distributed session storage, which is essential for production deployments with multiple server instances.

## Benefits of Redis Session Storage
- **Horizontal scaling**: Sessions shared across multiple server instances
- **Session persistence**: Sessions survive server restarts
- **Better performance**: Redis is faster than in-memory storage for large session data
- **Session cleanup**: Automatic expiration of old sessions

## Configuration

### Environment Variables
Add these to your `.env` file or cloud platform environment variables:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
```

### Cloud Platform Setup

**Render.com:**
1. Create a Redis instance in Render
2. Add Redis connection details to environment variables
3. The application will automatically use Redis if `REDIS_HOST` is set

**Azure:**
1. Create Azure Cache for Redis
2. Get connection string from Azure Portal
3. Parse connection string to extract host, port, password
4. Set environment variables accordingly

**AWS:**
1. Create ElastiCache Redis cluster
2. Configure security group to allow access
3. Set environment variables

## Local Development with Redis

### Option 1: Docker (Recommended)
```bash
docker run -d -p 6379:6379 redis:alpine
```

### Option 2: Windows
1. Download Redis for Windows from GitHub
2. Extract and run `redis-server.exe`

### Option 3: WSL2 (Ubuntu)
```bash
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

## Fallback Behavior
If Redis is not configured (`REDIS_HOST` not set), the application falls back to memory-based session storage with a warning. This is acceptable for development but not recommended for production.

## Monitoring Redis
Check Redis connection status in application logs:
- "Using Redis for session storage" - Connected successfully
- "Redis not configured, using memory store" - Not configured
- "Redis connection error" - Connection failed

## Redis Commands for Debugging
```bash
# Connect to Redis CLI
redis-cli

# View all sessions
KEYS session:*

# View specific session
GET session:session-id

# Delete all sessions
FLUSHDB

# Monitor commands
MONITOR
```

## Security
- Always use Redis password in production
- Use TLS/SSL for Redis connections in production
- Restrict Redis access to application servers only
- Regularly rotate Redis passwords
- Enable Redis AUTH

## Performance Tuning
- Adjust `maxmemory-policy` in Redis config
- Monitor Redis memory usage
- Set appropriate session TTL (30 minutes default)
- Consider Redis persistence (RDB/AOF) based on requirements

## Troubleshooting
- **Connection refused**: Check Redis is running and accessible
- **Authentication failed**: Verify REDIS_PASSWORD is correct
- **Session not persisting**: Check Redis memory limits
- **Slow performance**: Monitor Redis CPU/memory usage
