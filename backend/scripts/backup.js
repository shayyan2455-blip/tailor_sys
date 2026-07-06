#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Load environment variables
require('dotenv').config();

const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  DB_HOST: process.env.DB_HOST,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_PORT: process.env.DB_PORT || 5432,
  BACKUP_DIRECTORY: process.env.BACKUP_DIRECTORY || path.join(__dirname, '../backups')
};

// Ensure backup directory exists
if (!fs.existsSync(env.BACKUP_DIRECTORY)) {
  fs.mkdirSync(env.BACKUP_DIRECTORY, { recursive: true });
}

function getConnectionString() {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }
  return `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;
}

function getBackupFileName() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  return `tailor_sys_backup_${dateStr}_${timeStr}.sql`;
}

async function createBackup() {
  const backupPath = path.join(env.BACKUP_DIRECTORY, getBackupFileName());
  const connectionString = getConnectionString();

  console.log('Starting database backup...');
  console.log(`Backup will be saved to: ${backupPath}`);

  try {
    // Use pg_dump to create backup
    const command = `pg_dump "${connectionString}" > "${backupPath}"`;
    
    await execAsync(command);
    
    console.log('✅ Backup completed successfully!');
    console.log(`📁 Backup file: ${backupPath}`);
    
    // Get file size
    const stats = fs.statSync(backupPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 File size: ${fileSizeMB} MB`);
    
    return backupPath;
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    throw error;
  }
}

async function cleanupOldBackups(keepDays = 7) {
  console.log(`Cleaning up backups older than ${keepDays} days...`);
  
  const files = fs.readdirSync(env.BACKUP_DIRECTORY);
  const now = Date.now();
  const maxAge = keepDays * 24 * 60 * 60 * 1000; // milliseconds
  
  let deletedCount = 0;
  
  for (const file of files) {
    if (!file.startsWith('tailor_sys_backup_') || !file.endsWith('.sql')) {
      continue;
    }
    
    const filePath = path.join(env.BACKUP_DIRECTORY, file);
    const stats = fs.statSync(filePath);
    const age = now - stats.mtime.getTime();
    
    if (age > maxAge) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Deleted old backup: ${file}`);
      deletedCount++;
    }
  }
  
  if (deletedCount > 0) {
    console.log(`✅ Cleaned up ${deletedCount} old backup(s)`);
  } else {
    console.log('✅ No old backups to clean up');
  }
}

async function restoreBackup(backupFile) {
  const backupPath = path.join(env.BACKUP_DIRECTORY, backupFile);
  const connectionString = getConnectionString();

  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  console.log('Starting database restore...');
  console.log(`Restoring from: ${backupPath}`);

  try {
    const command = `psql "${connectionString}" < "${backupPath}"`;
    
    await execAsync(command);
    
    console.log('✅ Restore completed successfully!');
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    throw error;
  }
}

async function listBackups() {
  const files = fs.readdirSync(env.BACKUP_DIRECTORY);
  const backups = files
    .filter(file => file.startsWith('tailor_sys_backup_') && file.endsWith('.sql'))
    .map(file => {
      const filePath = path.join(env.BACKUP_DIRECTORY, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
        created: stats.mtime.toISOString()
      };
    })
    .sort((a, b) => new Date(b.created) - new Date(a.created));

  if (backups.length === 0) {
    console.log('No backups found.');
    return;
  }

  console.log('Available backups:');
  console.log('─'.repeat(80));
  backups.forEach((backup, index) => {
    console.log(`${index + 1}. ${backup.name}`);
    console.log(`   Size: ${backup.size} | Created: ${backup.created}`);
  });
}

// Command line interface
const command = process.argv[2];
const argument = process.argv[3];

async function main() {
  switch (command) {
    case 'backup':
      await createBackup();
      await cleanupOldBackups();
      break;
    case 'restore':
      if (!argument) {
        console.error('Please specify backup file to restore');
        console.log('Usage: node backup.js restore <backup_file>');
        process.exit(1);
      }
      await restoreBackup(argument);
      break;
    case 'list':
      await listBackups();
      break;
    case 'cleanup':
      const days = parseInt(argument) || 7;
      await cleanupOldBackups(days);
      break;
    default:
      console.log('Database Backup Utility');
      console.log('');
      console.log('Usage:');
      console.log('  node backup.js backup      - Create a new backup and cleanup old ones');
      console.log('  node backup.js restore <file> - Restore from a backup file');
      console.log('  node backup.js list        - List all available backups');
      console.log('  node backup.js cleanup [days] - Clean up old backups (default: 7 days)');
      console.log('');
      console.log('Examples:');
      console.log('  node backup.js backup');
      console.log('  node backup.js restore tailor_sys_backup_2024-01-15_10-30-00.sql');
      console.log('  node backup.js list');
      console.log('  node backup.js cleanup 30');
  }
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
