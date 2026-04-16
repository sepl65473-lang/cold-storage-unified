-- TimescaleDB Data Retention Policies
-- raw 90-day retention for SensorReadings
-- 2-year retention for Materialized Aggregates

-- 1. Create a retention policy for the raw hypertable
SELECT add_retention_policy('sensor_readings', INTERVAL '90 days');

-- 2. Create continuous aggregates for long-term storage (e.g., hourly averages)
CREATE MATERIALIZED VIEW sensor_readings_hourly
WITH (timescaledb.continuous) AS
SELECT device_id,
       time_bucket(INTERVAL '1 hour', time) AS bucket,
       AVG(temperature) as avg_temp,
       MAX(temperature) as max_temp,
       MIN(temperature) as min_temp,
       AVG(humidity) as avg_humidity
FROM sensor_readings
GROUP BY device_id, bucket;

-- 3. Add retention policy for the aggregate (2 years)
SELECT add_retention_policy('sensor_readings_hourly', INTERVAL '2 years');

-- Audit Log Table for GDPR/Compliance
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for performance
CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- 7-year retention for Audit Logs (Standard enterprise compliance)
-- Note: Audit logs are usually regular tables, not hypertables, but 
-- we can still use common cleanup procedures or move to archival storage.
