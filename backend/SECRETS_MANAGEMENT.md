# Secrets Management Guide

## Overview
This application uses environment variables for secrets management. In production, secrets should never be committed to code or stored in configuration files.

## Development Environment
For local development, use the `.env` file in the backend directory:

```env
DB_SERVER=localhost
DB_NAME=TailorERP
DB_USER=
DB_PASSWORD=
DB_PORT=1433
DB_ENCRYPT=true
SESSION_SECRET=your-secret-key-min-16-characters
COOKIE_NAME=tailor.sid
COOKIE_SECURE=false
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
PORT=4000
BCRYPT_SALT_ROUNDS=10
BACKUP_DIRECTORY=./backups
GMAIL_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

## Production Environment

### Option 1: Environment Variables (Recommended for Cloud Platforms)
Cloud platforms like Render, Railway, and Azure App Services provide built-in environment variable management.

**Render.com:**
1. Go to your web service dashboard
2. Click "Environment" tab
3. Add each environment variable
4. Never commit `.env` file to git

**Azure App Service:**
1. Go to App Service → Configuration → Application Settings
2. Add each setting as a key-value pair
3. Enable "Slot Setting" for environment-specific values

### Option 2: Azure Key Vault (Enterprise)
For enterprise deployments, use Azure Key Vault:

```bash
# Install Azure CLI and authenticate
az login

# Create Key Vault
az keyvault create --name tailor-erp-kv --resource-group tailor-rg --location eastus

# Store secrets
az keyvault secret set --vault-name tailor-erp-kv --name DB-USER --value "your-db-user"
az keyvault secret set --vault-name tailor-erp-kv --name DB-PASSWORD --value "your-db-password"
az keyvault secret set --vault-name tailor-erp-kv --name SESSION-SECRET --value "your-session-secret"
```

Then use Azure Key Vault provider in your application to fetch secrets at runtime.

### Option 3: AWS Secrets Manager
For AWS deployments:

```bash
# Store secret
aws secretsmanager create-secret --name tailor-erp/db-password --secret-string "your-db-password"

# Retrieve in application using AWS SDK
```

## Required Secrets

### Database
- `DB_SERVER`: SQL Server hostname
- `DB_NAME`: Database name
- `DB_USER`: Database username (optional for Windows Auth)
- `DB_PASSWORD`: Database password (optional for Windows Auth)
- `DB_PORT`: Database port (default 1433)
- `DB_ENCRYPT`: Enable SSL encryption (true in production)

### Session
- `SESSION_SECRET`: Secret key for session encryption (minimum 16 characters)
- `COOKIE_NAME`: Session cookie name
- `COOKIE_SECURE`: Set to true in production (HTTPS only)

### Email
- `GMAIL_EMAIL`: Gmail address for sending emails
- `GMAIL_APP_PASSWORD`: Gmail app-specific password

### Application
- `CORS_ORIGIN`: Frontend URL
- `NODE_ENV`: environment (development/production)
- `PORT`: Server port
- `BCRYPT_SALT_ROUNDS`: Password hashing rounds (10-15)
- `BACKUP_DIRECTORY`: Path for database backups

## Security Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Rotate secrets regularly** - Every 90 days for production
3. **Use different secrets per environment** - Dev, staging, production
4. **Limit secret access** - Only authorized personnel
5. **Audit secret access** - Log who accesses what secrets
6. **Use strong secrets** - Minimum 32 characters, random strings
7. **Encrypt secrets at rest** - Cloud providers handle this automatically
8. **Use secret scanning** - GitHub Secret Scanner, GitGuardian, etc.

## Secret Generation

Generate strong secrets using:

```bash
# Session secret (32 characters)
openssl rand -base64 32

# Database password (24 characters)
openssl rand -base64 24
```

## Validation

The application validates required secrets on startup. Missing secrets will cause the application to fail fast with a clear error message.

## Backup Strategy

- Backup your secrets separately from code
- Document secret recovery procedures
- Test secret rotation process regularly
- Have emergency access procedures
