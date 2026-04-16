# Disaster Recovery (DR) Runbook - Cold Storage Platform

## 1. Objective
Ensure maximum uptime and data integrity for decentralized cold storage fleet monitoring.

## 2. Infrastructure Backup (RTO 4h, RPO 1h)
### 2.1 Database Backups
- **Automated:** `scripts/dr/backup_db.sh` runs daily as a cron job.
- **Manual Trigger:**
  ```bash
  docker exec cs_db /bin/bash /app/scripts/dr/backup_db.sh
  ```
- **Storage:** Compressed `.sql.gz` files stored in AWS S3 (`s3://cold-storage-backups/db/`).

### 2.2 Configuration & Infrastructure as Code
- **Terraform:** Infrastructure definitions stored in `infra/terraform/`.
- **Docker-Compose:** Local/Staging environment state stored in version control.

## 3. Recovery Procedures (Restore Flow)

### 3.1 Restoring Database from S3
1. Download latest snapshot:
   ```bash
   aws s3 cp s3://cold-storage-backups/db/latest.sql.gz .
   ```
2. Decompress:
   ```bash
   gunzip latest.sql.gz
   ```
3. Inject into new instance:
   ```bash
   psql -h <new_host> -U postgres -d cold_storage < latest.sql
   ```

### 3.2 Hardware OTA Rollback
In case of faulty firmware update:
- Use MQTT command to broadcast rollback signal:
  `coldstorage/+/+/ota/rollback`
- ESP32 hardware will switch to the previous passive OTA partition.

## 4. Emergency Contacts
- **Infrastructure Lead:** nigam (nigam@coldstorage.com)
- **AWS Support:** Enterprise Support ID: 123456789
