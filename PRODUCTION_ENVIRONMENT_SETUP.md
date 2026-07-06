# Production Environment Configuration Guide

## Required Environment Variables

### Database Configuration
```bash
# Option 1: Use DATABASE_URL (recommended for production)
DATABASE_URL=postgresql://username:password@host:port/database_name

# Option 2: Individual database parameters
DB_HOST=your-database-host.com
DB_NAME=tailor_sys_production
DB_USER=your_database_user
DB_PASSWORD=your_secure_password
DB_PORT=5432
DB_SSL=true  # Required for remote databases
```

### Security Configuration
```bash
# Session security (CRITICAL - generate a strong random string)
SESSION_SECRET=your-very-long-random-secret-key-at-least-32-characters-long

# Cookie configuration
COOKIE_NAME=tailor.sid
COOKIE_SECURE=true  # Required for production (HTTPS only)
```

### CORS Configuration
```bash
# Your frontend domain in production
CORS_ORIGIN=https://your-frontend-domain.com
```

### Environment Configuration
```bash
NODE_ENV=production
PORT=4000
```

### Password Security
```bash
BCRYPT_SALT_ROUNDS=12  # Higher than default (10) for better security
```

### Backup Configuration
```bash
BACKUP_DIRECTORY=/var/backups/tailor_sys  # or your preferred backup location
```

### Redis Configuration (Optional but Recommended)
```bash
# Option 1: Use REDIS_URL
REDIS_URL=redis://username:password@host:port/db

# Option 2: Individual Redis parameters
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
REDIS_TLS=true  # Required for secure Redis connections
```

## How to Set Environment Variables

### Option 1: Vercel Environment Variables (Recommended for Vercel Deployment)

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with its value
4. Select the appropriate environment (Production, Preview, Development)
5. Redeploy your application

### Option 2: .env File (Local Development)

Create a `.env.production` file in the backend directory:

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SESSION_SECRET=your-secure-random-secret-here
COOKIE_SECURE=true
CORS_ORIGIN=https://yourdomain.com
NODE_ENV=production
PORT=4000
BCRYPT_SALT_ROUNDS=12
```

### Option 3: System Environment Variables

For Linux/Mac:
```bash
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"
export SESSION_SECRET="your-secure-random-secret"
export COOKIE_SECURE=true
export CORS_ORIGIN="https://yourdomain.com"
export NODE_ENV=production
```

For Windows (PowerShell):
```powershell
$env:DATABASE_URL="postgresql://user:pass@host:5432/dbname"
$env:SESSION_SECRET="your-secure-random-secret"
$env:COOKIE_SECURE="true"
$env:CORS_ORIGIN="https://yourdomain.com"
$env:NODE_ENV="production"
```

## Generating Secure SESSION_SECRET

Generate a cryptographically secure random string:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Using Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

## Database-Specific Configuration

### Supabase
```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
DB_SSL=true
```

### Railway
```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-ID].railway.app:5432/railway
DB_SSL=true
```

### Vercel Postgres
```bash
# Vercel automatically provides POSTGRES_URL
# Use it directly or set as DATABASE_URL
DATABASE_URL=${POSTGRES_URL}
```

### AWS RDS
```bash
DATABASE_URL=postgresql://masteruser:password@instance-id.region.rds.amazonaws.com:5432/dbname
DB_SSL=true
```

## Security Best Practices

1. **Never commit .env files to version control**
2. **Use different secrets for development and production**
3. **Rotate secrets periodically**
4. **Use environment-specific configurations**
5. **Limit database user permissions (principle of least privilege)**
6. **Enable SSL for all database connections in production**

## Verification Checklist

Before going to production, verify:

- [ ] DATABASE_URL connects successfully to production database
- [ ] SESSION_SECRET is a strong random string (32+ characters)
- [ ] COOKIE_SECURE is set to true (HTTPS required)
- [ ] CORS_ORIGIN matches your production frontend domain
- [ ] NODE_ENV is set to "production"
- [ ] DB_SSL is enabled for remote databases
- [ ] Database user has appropriate permissions (not superuser)
- [ ] Backup directory exists and is writable
- [ ] Redis connection works (if using Redis)

## Testing Environment Configuration

Test your configuration locally before deploying:

```bash
# In backend directory
NODE_ENV=production node -e "require('./src/config/env'); console.log('Environment loaded successfully')"
```

## Common Issues and Solutions

**Issue: "Invalid environment" error**
- Solution: Check that all required variables are set and valid
- Verify SESSION_SECRET is at least 16 characters

**Issue: Database connection fails**
- Solution: Verify DATABASE_URL format and credentials
- Check if DB_SSL is required for your database provider
- Ensure database is accessible from your deployment environment

**Issue: CORS errors**
- Solution: Ensure CORS_ORIGIN matches your exact frontend URL
- Include protocol (https://) and port if non-standard

**Issue: Session not persisting**
- Solution: Verify SESSION_SECRET is consistent across deployments
- Check COOKIE_SECURE setting (must be true for HTTPS)
