"""Initial schema — organizations, users, devices, sensor_readings (hypertable),
alerts, device_commands, audit_logs.

Revision ID: 0001_initial
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Extensions ────────────────────────────────────────────────────────────
    op.execute("CREATE EXTENSION IF NOT EXISTS timescaledb;")
    op.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")

    # ── Organizations ────────────────────────────────────────────────────────
    op.create_table(
        "organizations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("region", sa.String(20), nullable=False, server_default="us-east-1"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    # ── Users ────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("organization_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("email_encrypted", sa.String(512), nullable=False),
        sa.Column("password_hash", sa.String(255)),
        sa.Column("sso_sub", sa.String(255)),
        sa.Column("role", sa.String(20), nullable=False, server_default="viewer"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("mfa_enabled", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("mfa_secret_encrypted", sa.String(512)),
        sa.Column("last_login", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_users_organization_id", "users", ["organization_id"])
    op.create_index("ix_users_sso_sub", "users", ["sso_sub"])

    # ── Devices ───────────────────────────────────────────────────────────────
    op.create_table(
        "devices",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("organization_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="offline"),
        sa.Column("firmware_version", sa.String(50)),
        sa.Column("last_seen", sa.DateTime(timezone=True)),
        sa.Column("location_lat", sa.Float),
        sa.Column("location_lng", sa.Float),
        sa.Column("location_label", sa.String(255)),
        sa.Column("thing_name", sa.String(255), unique=True),
        sa.Column("certificate_arn", sa.String(512)),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_devices_organization_id", "devices", ["organization_id"])
    op.create_index("ix_devices_last_seen", "devices", ["last_seen"])

    # ── SensorReadings (TimescaleDB Hypertable) ───────────────────────────────
    op.create_table(
        "sensor_readings",
        sa.Column("time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("device_id", UUID(as_uuid=True), sa.ForeignKey("devices.id"), nullable=False),
        sa.Column("temperature", sa.Float(precision=4)),
        sa.Column("humidity", sa.Float(precision=4)),
        sa.Column("battery_level", sa.Float(precision=4)),
        sa.Column("solar_power_watts", sa.Float(precision=4)),
        sa.Column("compressor_state", sa.Boolean),
        sa.Column("door_state", sa.Boolean),
        sa.Column("cooling_cycle_duration", sa.Integer),
        sa.PrimaryKeyConstraint("time", "device_id"),
    )
    # Convert to TimescaleDB hypertable — 1-week chunks
    op.execute(
        "SELECT create_hypertable('sensor_readings', 'time', "
        "chunk_time_interval => INTERVAL '1 week', "
        "if_not_exists => TRUE);"
    )
    # Covering index for per-device time-series queries
    op.execute(
        "CREATE INDEX ix_sensor_readings_device_time "
        "ON sensor_readings (device_id, time DESC);"
    )
    # 90-day retention policy
    op.execute(
        "SELECT add_retention_policy('sensor_readings', INTERVAL '90 days', if_not_exists => TRUE);"
    )

    # Hourly continuous aggregate
    op.execute("""
        CREATE MATERIALIZED VIEW sensor_readings_hourly
        WITH (timescaledb.continuous) AS
        SELECT
            time_bucket('1 hour', time) AS bucket,
            device_id,
            AVG(temperature) AS avg_temperature,
            AVG(humidity) AS avg_humidity,
            AVG(battery_level) AS avg_battery_level,
            AVG(solar_power_watts) AS avg_solar_power_watts,
            COUNT(*) AS sample_count
        FROM sensor_readings
        GROUP BY bucket, device_id
        WITH NO DATA;
    """)
    op.execute(
        "SELECT add_retention_policy('sensor_readings_hourly', INTERVAL '2 years', if_not_exists => TRUE);"
    )

    # Daily continuous aggregate
    op.execute("""
        CREATE MATERIALIZED VIEW sensor_readings_daily
        WITH (timescaledb.continuous) AS
        SELECT
            time_bucket('1 day', bucket) AS bucket,
            device_id,
            AVG(avg_temperature) AS avg_temperature,
            AVG(avg_humidity) AS avg_humidity,
            AVG(avg_battery_level) AS avg_battery_level,
            AVG(avg_solar_power_watts) AS avg_solar_power_watts,
            SUM(sample_count) AS sample_count
        FROM sensor_readings_hourly
        GROUP BY time_bucket('1 day', bucket), device_id
        WITH NO DATA;
    """)

    # ── Alerts ────────────────────────────────────────────────────────────────
    op.create_table(
        "alerts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("device_id", UUID(as_uuid=True), sa.ForeignKey("devices.id"), nullable=False),
        sa.Column("organization_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("type", sa.String(30), nullable=False),
        sa.Column("severity", sa.String(20), nullable=False, server_default="warning"),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("is_resolved", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("resolved_at", sa.DateTime(timezone=True)),
        sa.Column("resolved_by", UUID(as_uuid=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_alerts_device_id", "alerts", ["device_id"])
    op.create_index("ix_alerts_organization_id", "alerts", ["organization_id"])
    op.create_index("ix_alerts_is_resolved", "alerts", ["is_resolved"])

    # ── Device Commands ────────────────────────────────────────────────────────
    op.create_table(
        "device_commands",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("device_id", UUID(as_uuid=True), sa.ForeignKey("devices.id"), nullable=False),
        sa.Column("issued_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("type", sa.String(30), nullable=False),
        sa.Column("value", JSONB, nullable=False, server_default="{}"),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True)),
        sa.Column("mqtt_message_id", sa.String(255)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_device_commands_device_id", "device_commands", ["device_id"])

    # ── Audit Logs ────────────────────────────────────────────────────────────
    op.create_table(
        "audit_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True)),
        sa.Column("organization_id", UUID(as_uuid=True), nullable=False),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("entity_type", sa.String(50)),
        sa.Column("entity_id", sa.String(255)),
        sa.Column("payload", JSONB),
        sa.Column("ip_address", sa.String(45)),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_audit_logs_organization_id", "audit_logs", ["organization_id"])
    op.create_index("ix_audit_logs_user_id", "audit_logs", ["user_id"])
    op.create_index("ix_audit_logs_org_timestamp", "audit_logs", ["organization_id", "timestamp"])

    # User push notification subscriptions (Web Push)
    op.create_table(
        "user_push_subscriptions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("endpoint", sa.Text, nullable=False),
        sa.Column("p256dh_key", sa.Text, nullable=False),
        sa.Column("auth_key", sa.Text, nullable=False),
        sa.Column("user_agent", sa.String(255)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_push_subscriptions_user_id", "user_push_subscriptions", ["user_id"])


def downgrade() -> None:
    op.drop_table("user_push_subscriptions")
    op.drop_table("audit_logs")
    op.drop_table("device_commands")
    op.drop_table("alerts")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS sensor_readings_daily;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS sensor_readings_hourly;")
    op.drop_table("sensor_readings")
    op.drop_table("devices")
    op.drop_table("users")
    op.drop_table("organizations")
