#!/bin/bash
set -e

# Database configuration
DB_NAME="smartstock"
DB_USER="postgres"
DB_PASSWORD="kamehameha"
DB_HOST="localhost"
DB_PORT="5432"

# Backup configuration
BACKUP_DIR=~/SmartStock/backups
DRIVE_PATH="dropbox:SmartStock-backups"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# File paths
BACKUP_FILE="$BACKUP_DIR/smartstock_backup.sql"
COMPRESSED_FILE="$BACKUP_DIR/smartstock_backup.sql.gz"

echo "🔄 Starting backup process..."

# Remove old files if they exist
rm -f "$BACKUP_FILE"
rm -f "$COMPRESSED_FILE"

# Create database backup
PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Database backup created successfully"
    
    # Compress backup (force overwrite if exists)
    gzip -f "$BACKUP_FILE"
    
    # Upload to Dropbox
    echo "Uploading to Dropbox..."
    rclone copy "$COMPRESSED_FILE" "$DRIVE_PATH" --progress --verbose --log-file rclone_debug.log
    
    if [ $? -eq 0 ]; then
        echo "Backup uploaded successfully (existing file overwritten)"
        
        # Clean up local compressed file
        rm -f "$COMPRESSED_FILE"
        
        echo "Backup process completed"
    else
        echo "Error uploading backup"
        exit 1
    fi
else
    echo "Error creating database backup"
    exit 1
fi