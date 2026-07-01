# Complete Deployment Guide - Free Hosting

## Overview
This guide will help you deploy the Tailor ERP application on free hosting using:
- **Render.com** for hosting (free tier)
- **Supabase** for PostgreSQL database (generous free tier)
- **Render Redis** for session storage (free tier)
- **Free domain** via Render or subdomain

## Prerequisites
- GitHub account with your code pushed
- Supabase account (free tier available)
- Render account (free tier available)
- 15-30 minutes for setup

---

## Step 1: Prepare Your Code for Deployment

### 1.1 Create Production Environment File

Create `backend/.env.production`:

```env
# Database Configuration (will be replaced by Render env vars)
DATABASE_URL=
DB_HOST=
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_PORT=5432

# Session Configuration
SESSION_SECRET=your-production-secret-key-minimum-32-characters-random
COOKIE_NAME=tailor.sid
COOKIE_SECURE=true

# CORS Configuration
CORS_ORIGIN=https://your-app.onrender.com

# Environment
NODE_ENV=production
PORT=4000

# Password Hashing
BCRYPT_SALT_ROUNDS=12

# Backup Directory
BACKUP_DIRECTORY=/tmp/backups

# Redis Configuration (from Render)
REDIS_HOST=
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### 1.2 Update Frontend API URL

Update `frontend/src/config/api.js` or wherever your API base URL is defined:

```javascript
// Use environment variable or fallback to Render URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-backend.onrender.com/api/v1';
```

### 1.3 Create Frontend Environment File

Create `frontend/.env.production`:

```env
VITE_API_URL=https://your-backend.onrender.com/api/v1
```

### 1.4 Add Start Scripts

Ensure `backend/package.json` has:
```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

Ensure `frontend/package.json` has:
```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 1.5 Create Procfile for Backend

Create `backend/Procfile`:
```
web: node src/server.js
```

### 1.6 Create Build Script for Frontend

Create `frontend/build.sh`:
```bash
#!/bin/bash
npm install
npm run build
```

Make it executable:
```bash
chmod +x frontend/build.sh
```

---

## Step 2: Set Up Supabase Database (Free Tier)

### 2.1 Create Supabase Account
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (easiest) or email
4. Free tier includes 500MB database, 1GB bandwidth

### 2.2 Create Database Project
1. After signing up, click "New Project"
2. Fill in:
   - **Name**: tailor-erp
   - **Database Password**: Strong password (save this!)
   - **Region**: Choose closest to you (e.g., Southeast Asia)
   - **Pricing Plan**: Free
3. Click "Create new project"
4. Wait 1-2 minutes for project to be created

### 2.3 Get Connection Details
1. Go to your project in Supabase dashboard
2. Click "Settings" → "API"
3. Copy the following:
   - **Project URL**: https://xxxxx.supabase.co
   - **anon public key**: (not needed for backend)
   - **service_role key**: (not needed for backend)
4. Click "Database" → "Connection string"
5. Copy the URI format:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### 2.4 Run Database Migrations
Option A: Use Supabase SQL Editor (Recommended)
1. Go to your Supabase project
2. Click "SQL Editor" in left sidebar
3. Click "New query"
4. Copy and run these SQL files in order (converted to PostgreSQL):
   - `database/postgresql/00_create_database.sql`
   - `database/postgresql/01_master_tables.sql`
   - `database/postgresql/02_transaction_tables.sql`
   - `database/postgresql/03_indexes_and_constraints.sql`
   - `database/postgresql/04_computed_columns_and_triggers.sql`
   - `database/postgresql/05_rbac_security.sql`
   - `database/postgresql/06_seed_data.sql`
   - `database/postgresql/add_otp_table.sql`
   - `database/postgresql/add_account_lockout.sql`
   - `database/postgresql/add_2fa.sql`
   - `database/postgresql/add_password_expiration.sql`
   - `database/postgresql/add_audit_log.sql`
   - `database/postgresql/add_indexes.sql`

Option B: Use psql (Command Line)
```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres" -f database/postgresql/00_create_database.sql
# Repeat for each file
```

**Note**: You'll need to convert the SQL Server schema files to PostgreSQL syntax first. See the "Database Migration" section below.

---

## Step 3: Set Up Redis on Render

### 3.1 Create Redis Instance
1. Go to https://dashboard.render.com
2. Click "New" → "Redis"
3. Name: `tailor-erp-redis`
4. Region: Oregon (or closest to you)
5. Plan: Free
6. Click "Create Redis"

### 3.3 Get Redis Connection Details
1. After creation, click on your Redis instance
2. Copy the "Internal Database URL" or connection details
3. Note the host, port, and password

---

## Step 4: Deploy Backend to Render

### 4.1 Push Code to GitHub
1. Ensure your code is on GitHub
2. Make sure `.env` is in `.gitignore` (it should be)
3. Commit and push all changes

### 4.2 Create Backend Web Service
1. Go to https://dashboard.render.com
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: tailor-erp-backend
   - **Region**: Oregon (same as Redis)
   - **Branch**: main
   - **Root Directory**: backend
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
5. Click "Advanced"
6. Add Environment Variables:
   ```
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   DB_HOST=db.xxxxx.supabase.co
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=yourpassword
   DB_PORT=5432
   SESSION_SECRET=your-production-secret-key-minimum-32-characters-random
   COOKIE_NAME=tailor.sid
   COOKIE_SECURE=true
   CORS_ORIGIN=https://tailor-erp-frontend.onrender.com
   NODE_ENV=production
   PORT=4000
   BCRYPT_SALT_ROUNDS=12
   BACKUP_DIRECTORY=/tmp/backups
   REDIS_HOST=your-redis-host
   REDIS_PORT=6379
   REDIS_PASSWORD=your-redis-password
   REDIS_DB=0
   ```
7. Click "Create Web Service"

### 4.3 Wait for Deployment
- Render will build and deploy your backend
- This takes 2-5 minutes
- Check the logs for any errors

### 4.4 Get Backend URL
- After deployment, Render will give you a URL like:
  `https://tailor-erp-backend.onrender.com`
- Copy this URL

---

## Step 5: Deploy Frontend to Render

### 5.1 Create Frontend Static Site
1. Go to https://dashboard.render.com
2. Click "New" → "Static Site"
3. Connect your GitHub repository
4. Configure:
   - **Name**: tailor-erp-frontend
   - **Region**: Oregon (same as backend)
   - **Branch**: main
   - **Root Directory**: frontend
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: dist
5. Click "Advanced"
6. Add Environment Variables:
   ```
   VITE_API_URL=https://tailor-erp-backend.onrender.com/api/v1
   ```
7. Click "Create Static Site"

### 5.2 Wait for Deployment
- Render will build and deploy your frontend
- This takes 1-3 minutes

### 5.3 Get Frontend URL
- After deployment, you'll get a URL like:
  `https://tailor-erp-frontend.onrender.com`

---

## Step 6: Configure Custom Domain (Optional)

### Option A: Use Render Subdomain (Free)
Your app is already accessible at:
- Frontend: `https://tailor-erp-frontend.onrender.com`
- Backend: `https://tailor-erp-backend.onrender.com`

### Option B: Use Free Domain Services

**Freenom (Free Domains)**
1. Go to https://www.freenom.com
2. Search for available free domains (.tk, .ml, .ga, .cf)
3. Register your domain
4. Go to Render → Your Service → Settings → Custom Domains
5. Add your domain
6. Update DNS records at Freenom to point to Render

**Option C: Use GitHub Pages (Free)**
1. Build your frontend locally
2. Push `dist/` folder to a GitHub repository
3. Enable GitHub Pages in repository settings
4. Your site will be at `https://yourusername.github.io/repo-name`

---

## Step 7: Post-Deployment Configuration

### 7.1 Update CORS
Update backend environment variable:
```
CORS_ORIGIN=https://your-frontend-domain.onrender.com
```

### 7.2 Test the Application
1. Open your frontend URL in browser
2. Try to login (create admin user if needed)
3. Test all major features
4. Check browser console for errors

### 7.3 Monitor Logs
1. Go to Render dashboard
2. Click on your services
3. View "Logs" tab for any errors

### 7.4 Set Up Automated Backups
Supabase includes automated backups on the free tier:
1. Go to Supabase project → Settings → Database
2. Backups are automatically created daily
3. Point-in-time recovery is available for 7 days on free tier

---

## Step 8: Free Tier Limitations

### Render Free Tier Limits
- **Web Services**: 750 hours/month (enough for 1 instance 24/7)
- **Redis**: 25 MB memory, 10 connections
- **Static Sites**: Unlimited
- **Sleeps**: Free tier web services sleep after 15 min inactivity (wakes up on request, takes 30 sec)

### Supabase Free Tier Limits
- **500MB** database storage
- **1GB** bandwidth per month
- **10,000** file storage
- **2** API requests per second
- **No time limit** - free tier is permanent
- **7 days** of point-in-time recovery

### Workarounds for Sleep
1. Use a cron job to ping your service every 10 minutes
2. Upgrade to paid Render tier ($7/month) to prevent sleep
3. Accept the 30-second wake-up time

---

## Step 9: Troubleshooting

### Common Issues

**Backend won't start**
- Check logs in Render dashboard
- Verify environment variables are correct
- Ensure database is accessible from Render (firewall rules)

**Frontend can't connect to backend**
- Verify CORS_ORIGIN is set correctly
- Check backend is running (not sleeping)
- Check API URL in frontend build

**Database connection errors**
- Verify DATABASE_URL is correct
- Check database credentials
- Ensure Supabase project is active (not paused)

**Redis connection errors**
- Verify Redis is running on Render
- Check Redis connection details
- Ensure Redis is in same region as backend

---

## Step 10: Maintenance

### Regular Tasks
- **Weekly**: Check Render logs for errors
- **Monthly**: Review Supabase usage (dashboard shows limits)
- **Quarterly**: Update dependencies
- **As needed**: Run database migrations for updates

### Scaling Up
When you need to scale beyond free tier:
1. **Render**: Upgrade to paid tier ($7/month) for no sleep
2. **Supabase**: Upgrade to Pro tier ($25/month) for 8GB database
3. **Redis**: Upgrade to larger instance for more memory

---

## Summary of Costs

**Free Tier (Permanent):**
- Render Backend: $0
- Render Frontend: $0
- Render Redis: $0
- Supabase: $0 (permanent free tier)
- **Total: $0/month**

**After Scaling:**
- Render Backend: $0 (if you accept sleep) or $7/month
- Render Frontend: $0
- Render Redis: $0
- Supabase Pro: $25/month (if needed)
- **Total: $0-32/month**

---

## Alternative: Railway (Another Free Option)

If Render doesn't work for you, try Railway:

1. Go to https://railway.app
2. Connect GitHub
3. Add PostgreSQL database (free tier)
4. Deploy backend and frontend
5. Railway provides free SSL and custom domains

Note: Railway uses PostgreSQL. Since we're using Supabase (PostgreSQL), Railway is also an option if you prefer an all-in-one solution.

---

## Quick Reference URLs

After deployment, save these:
- Frontend URL: `https://tailor-erp-frontend.onrender.com`
- Backend URL: `https://tailor-erp-backend.onrender.com`
- Supabase Dashboard: `https://supabase.com/dashboard`
- Render Dashboard: `https://dashboard.render.com`
- Database URL: `postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres`

---

## Database Migration: SQL Server to PostgreSQL

Since the application was built for SQL Server, you need to convert the database schema to PostgreSQL before running migrations.

### Key Differences to Handle:

1. **Data Types**:
   - `NVARCHAR` → `VARCHAR`
   - `DATETIME2` → `TIMESTAMP`
   - `BIT` → `BOOLEAN`
   - `DECIMAL(18,2)` → `NUMERIC(18,2)`

2. **Auto-increment**:
   - `IDENTITY(1,1)` → `SERIAL` or `GENERATED ALWAYS AS IDENTITY`

3. **Default Values**:
   - `GETDATE()` → `NOW()`
   - `SYSUTCDATETIME()` → `NOW()`

4. **String Concatenation**:
   - `+` → `||`

5. **TOP vs LIMIT**:
   - `SELECT TOP 10` → `SELECT ... LIMIT 10`

6. **Quoting**:
   - `[table]` → `"table"`
   - `N'string'` → `'string'`

### Conversion Steps:

1. Create `database/postgresql/` directory
2. Convert each SQL file from `database/` to PostgreSQL syntax
3. Update backend code to use `pg` instead of `mssql`
4. Update all SQL queries in controllers to use PostgreSQL syntax

### Automated Conversion Tool:

You can use online tools like:
- https://www.sqlines.com/online (SQL Server to PostgreSQL)
- https://www.convert-in.com/mss2pgs.htm

Or use the `pgloader` command-line tool for automated migration.
