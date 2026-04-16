#!/bin/bash
# Cold Storage Platform - Automated Database Backup Script
# Retains daily snapshots and compresses to gzip before syncing to S3

set -e

BACKUP_DIR="/backups"
DB_HOST="db"
DB_USER="postgres"
DB_NAME="cold_storage"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "Starting Cold Storage TimescaleDB Backup at ${TIMESTAMP}..."

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Execute pg_dump and compress on the fly
PGPASSWORD=$POSTGRES_PASSWORD pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -Cc | gzip > "$BACKUP_FILE"

echo "Backup created successfully: $BACKUP_FILE"

# Upload to S3 (AWS CLI needs to be configured in the environment)
if [ -n "$AWS_S3_BACKUP_BUCKET" ]; then
    echo "Pushing backup to S3 Bucket: $AWS_S3_BACKUP_BUCKET"
    aws s3 cp "$BACKUP_FILE" "s3://${AWS_S3_BACKUP_BUCKET}/db-backups/"
    
    echo "S3 Upload Complete."
else
    echo "AWS_S3_BACKUP_BUCKET not set. Skipping S3 upload."
fi

# Cleanup old backups (keep last 7 days locally)
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +7 -exec rm {} \;
echo "Cleaned up old local backups."
