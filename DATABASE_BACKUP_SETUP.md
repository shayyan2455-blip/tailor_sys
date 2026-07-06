# Database Backup Strategy

## Overview

The backup strategy includes:
- **Automated daily backups** using cron jobs
- **Manual backup/restore** via command-line script
- **Automatic cleanup** of old backups (configurable retention period)
- **Backup verification** and monitoring

## Backup Script

A backup script has been created at `backend/scripts/backup.js` with the following features:
- Create full database backups using `pg_dump`
- Restore databases from backup files
- List available backups
- Clean up old backups automatically
- Support for both DATABASE_URL and individual DB parameters

## Manual Backup Usage

### Create a Backup
```bash
cd backend
node scripts/backup.js backup
```

This will:
1. Create a new backup with timestamp: `tailor_sys_backup_YYYY-MM-DD_HH-MM-SS.sql`
2. Save it to the backup directory (default: `backend/backups`)
3. Clean up backups older than 7 days (configurable)

### Restore from Backup
```bash
cd backend
node scripts/backup.js restore tailor_sys_backup_2024-01-15_10-30-00.sql
```

### List Available Backups
```bash
cd backend
node scripts/backup.js list
```

### Clean Up Old Backups
```bash
cd backend
node scripts/backup.js cleanup 30  # Keep backups for 30 days
```

## Setting Up Automated Backups

### Option 1: Using Cron (Linux/Mac/Production Servers)

1. **Edit crontab:**
```bash
crontab -e
```

2. **Add daily backup job (runs at 2 AM daily):**
```bash
0 2 * * * cd /path/to/tailor_sys/backend && node scripts/backup.js backup >> /var/log/tailor_sys_backup.log 2>&1
```

3. **Add weekly full backup (runs every Sunday at 3 AM):**
```bash
0 3 * * 0 cd /path/to/tailor_sys/backend && node scripts/backup.js backup >> /var/log/tailor_sys_backup.log 2>&1
```

### Option 2: Using Windows Task Scheduler

1. Open Task Scheduler
2. Create a new task:
   - **Trigger:** Daily at 2:00 AM
   - **Action:** Run a program
   - **Program:** `node`
   - **Arguments:** `C:\path\to\tailor_sys\backend\scripts\backup.js backup`
   - **Start in:** `C:\path\to\tailor_sys\backend`

### Option 3: Using GitHub Actions (CI/CD)

Create `.github/workflows/database-backup.yml`:

```yaml
name: Database Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:     # Allow manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend
          npm ci
      
      - name: Run backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          BACKUP_DIRECTORY: ./backups
        run: |
          cd backend
          node scripts/backup.js backup
      
      - name: Upload backup artifact
        uses: actions/upload-artifact@v3
        with:
          name: database-backup-${{ github.run_number }}
          path: backend/backups/*.sql
          retention-days: 30
```

### Option 4: Using Vercel Cron Jobs (if using Vercel)

1. Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/backup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

2. Create backup endpoint in backend (optional - for Vercel cron)

## Backup Storage Locations

### Local Storage
- Default: `backend/backups/`
- Configurable via `BACKUP_DIRECTORY` environment variable

### Cloud Storage (Recommended for Production)

#### AWS S3
```bash
# Install AWS CLI
pip install awscli

# Configure AWS credentials
aws configure

# Upload backup to S3 after creation
aws s3 cp backend/backups/tailor_sys_backup.sql s3://your-bucket/backups/
```

#### Google Cloud Storage
```bash
# Install gsutil
curl https://sdk.cloud.google.com | bash

# Upload backup
gsutil cp backend/backups/tailor_sys_backup.sql gs://your-bucket/backups/
```

#### Backblaze B2
```bash
# Install B2 CLI
pip install b2-command-line-tool

# Upload backup
b2 upload-file your-bucket backend/backups/tailor_sys_backup.sql backups/tailor_sys_backup.sql
```

## Environment Variables

```bash
# Backup directory (optional, defaults to ./backups)
BACKUP_DIRECTORY=/var/backups/tailor_sys

# Database connection (required)
DATABASE_URL=postgresql://user:pass@host:5432/dbname
# OR individual parameters
DB_HOST=localhost
DB_NAME=tailor_sys
DB_USER=postgres
DB_PASSWORD=your_password
DB_PORT=5432
```

## Backup Retention Policy

**Default:** Keep backups for 7 days

**Recommended for production:**
- Daily backups: Keep for 7 days
- Weekly backups: Keep for 4 weeks  
- Monthly backups: Keep for 12 months

**Example retention schedule:**
```bash
# Daily cleanup (keep 7 days)
node scripts/backup.js cleanup 7

# Weekly cleanup (keep 30 days)
node scripts/backup.js cleanup 30

# Monthly cleanup (keep 90 days)
node scripts/backup.js cleanup 90
```

## Monitoring Backups

### Log Backup Results
```bash
# Add logging to cron job
0 2 * * * cd /path/to/backend && node scripts/backup.js backup >> /var/log/tailor_backup.log 2>&1

# Check logs
tail -f /var/log/tailor_backup.log
```

### Backup Size Monitoring
The backup script outputs file size in MB after each backup. Monitor for:
- Sudden size increases (might indicate data issues)
- Backup failures (check logs)
- Missing backups (monitoring alerts)

### Backup Verification
Periodically test restore process:
```bash
# Restore to test database
node scripts/backup.js restore tailor_sys_backup_2024-01-15_10-30-00.sql
```

## Disaster Recovery Plan

### Immediate Recovery (1-4 hours)
1. Identify last good backup
2. Restore to staging environment
3. Verify data integrity
4. Switch DNS to staging if needed

### Full Recovery (4-24 hours)
1. Restore to production environment
2. Run data consistency checks
3. Monitor application performance
4. Communicate with stakeholders

## Best Practices

1. **Test backups regularly** - Don't wait until disaster strikes
2. **Store backups off-site** - Use cloud storage for production
3. **Encrypt sensitive backups** - If database contains PII
4. **Document restore process** - Keep runbooks updated
5. **Monitor backup success** - Set up alerts for failures
6. **Version control backup scripts** - Track changes
7. **Use compression** - For large databases (add `--compress` to pg_dump)

## Troubleshooting

**Issue: "pg_dump: command not found"**
- Solution: Install PostgreSQL client tools
- Ubuntu: `sudo apt-get install postgresql-client`
- Mac: `brew install postgresql`
- Windows: Download from PostgreSQL website

**Issue: "Permission denied" writing to backup directory**
- Solution: Ensure backup directory is writable
- `chmod 755 /path/to/backups`

**Issue: Backup file is too large**
- Solution: Use compression or split backups
- Add `--compress` flag to pg_dump command

**Issue: Restore fails with "relation already exists"**
- Solution: Drop existing database or use `--clean` flag
- `pg_dump --clean` before backup

## Security Considerations

1. **Secure backup files** - Encrypt if containing sensitive data
2. **Limit access** - Restrict backup directory permissions
3. **Secure credentials** - Don't hardcode passwords in scripts
4. **Audit access** - Log who accesses backup files
5. **Test security** - Regular penetration testing

## Next Steps

1. ✅ Backup script created
2. ⏳ Set up automated backups (choose method above)
3. ⏳ Configure cloud storage for production
4. ⏳ Test restore process
5. ⏳ Set up monitoring and alerts
