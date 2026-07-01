const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const env = require('../config/env');

const backupDir = env.BACKUP_DIRECTORY;
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupFile = path.join(backupDir, `tailor_erp_backup_${timestamp}.bak`);

async function createBackup() {
  try {
    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Build sqlcmd command
    const sqlcmd = `sqlcmd -S ${env.DB_SERVER},${env.DB_PORT} -d ${env.DB_NAME} -E -Q "BACKUP DATABASE [${env.DB_NAME}] TO DISK = N'${backupFile}' WITH FORMAT, MEDIANAME = 'TailorERP_Full', NAME = 'Full Backup of TailorERP';"`;
    
    console.log('Starting database backup...');
    const { stdout, stderr } = await execAsync(sqlcmd);
    
    if (stderr) {
      console.error('Backup stderr:', stderr);
    }
    
    console.log('Backup completed successfully:', backupFile);
    
    // Clean up old backups (keep last 7 days)
    await cleanupOldBackups();
    
    return backupFile;
  } catch (error) {
    console.error('Backup failed:', error);
    throw error;
  }
}

async function cleanupOldBackups() {
  try {
    const files = fs.readdirSync(backupDir);
    const backupFiles = files.filter(f => f.startsWith('tailor_erp_backup_') && f.endsWith('.bak'));
    
    // Sort by date (newest first)
    backupFiles.sort((a, b) => {
      const dateA = a.match(/tailor_erp_backup_(.+)\.bak/)[1];
      const dateB = b.match(/tailor_erp_backup_(.+)\.bak/)[1];
      return dateB.localeCompare(dateA);
    });
    
    // Keep only last 7 backups
    const filesToDelete = backupFiles.slice(7);
    
    for (const file of filesToDelete) {
      const filePath = path.join(backupDir, file);
      fs.unlinkSync(filePath);
      console.log('Deleted old backup:', file);
    }
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}

// Run backup if called directly
if (require.main === module) {
  createBackup()
    .then(() => {
      console.log('Backup process completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Backup process failed:', error);
      process.exit(1);
    });
}

module.exports = { createBackup };
