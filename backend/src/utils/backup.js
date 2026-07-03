const fs = require('fs');
const path = require('path');
const { pg, query } = require('../config/db');
const env = require('../config/env');

const backupDir = env.BACKUP_DIRECTORY;
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupFile = path.join(backupDir, `tailor_erp_backup_${timestamp}.json`);

async function createBackup() {
  try {
    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log('Starting database backup...');
    
    // Get list of all tables
    const tablesResult = await pg.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    const backupData = { timestamp, tables: {} };
    
    // Dump each table
    for (const table of tables) {
      const dataResult = await pg.query(`SELECT * FROM "${table}"`);
      backupData.tables[table] = dataResult.rows;
      console.log(`Backed up table: ${table} (${dataResult.rows.length} rows)`);
    }
    
    // Write backup file
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log('Backup completed successfully:', backupFile);
    
    // Clean up old backups (keep last 7 backups)
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
    const backupFiles = files.filter(f => f.startsWith('tailor_erp_backup_') && f.endsWith('.json'));
    
    // Sort by date (newest first)
    backupFiles.sort((a, b) => {
      const dateA = a.match(/tailor_erp_backup_(.+)\.json/)[1];
      const dateB = b.match(/tailor_erp_backup_(.+)\.json/)[1];
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
