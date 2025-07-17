#!/bin/bash

DB_NAME="smartstock"
DB_USER="postgres"
DB_PASSWORD="kamehameha"
DB_HOST="postgres"
DB_PORT="5432"
BACKUP_DIR="~/SmartStock/backups"
DRIVE_PATH="gdrive:SmartStock-backups"

COMPRESSED_FILE="$BACKUP_DIR/smartstock_backup.sql.gz"
BACKUP_FILE="$BACKUP_DIR/smartstock_backup.sql"

echo 🔄 Starting backup process...
PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Database backup created successfully"
    
    # Compress backup
    gzip "$BACKUP_FILE"
    
    # Overwrite existing backup on Google Drive
    echo "Uploading to Google Drive..."
    rclone copy "$COMPRESSED_FILE" "$DRIVE_PATH" --progress
    
    if [ $? -eq 0 ]; then
        echo "Backup uploaded successfully (existing file overwritten)"
        
        rm "$COMPRESSED_FILE"
        
        echo "Backup process completed"
    else
        echo "Error uploading backup"
        exit 1
    fi
else
    echo "Error creating database backup"
    exit 1
fi