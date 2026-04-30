"""Seed SEPL Cold Storage production organisation and ESP32 device.

Revision ID: 0003_seed_production_org
Revises: 0002_organization_settings
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0003_seed_production_org"
down_revision = "0002_organization_settings"
branch_labels = None
depends_on = None

ORG_ID     = "b9f1c2d3-e4a5-4b6c-7d8e-9f0a1b2c3d4e"
DEVICE_ID  = "c3a1b2d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"


def upgrade() -> None:
    conn = op.get_bind()

    # 1. Create SEPL Cold Storage organisation first (needed before moving users)
    conn.execute(sa.text("""
        INSERT INTO organizations (id, name, region, is_active)
        VALUES (:id, 'SEPL Cold Storage', 'ap-south-1', true)
        ON CONFLICT (id) DO NOTHING
    """), {"id": ORG_ID})

    # 2. Move all users from Demo Organization -> SEPL Cold Storage
    #    (preserves admin accounts — avoids FK violation on delete)
    conn.execute(sa.text("""
        UPDATE users
        SET organization_id = :new_org
        WHERE organization_id IN (
            SELECT id FROM organizations WHERE name = 'Demo Organization'
        )
    """), {"new_org": ORG_ID})

    # 3. Delete Demo Organization data (users already moved, FK safe now)
    conn.execute(sa.text("""
        DELETE FROM sensor_readings
        WHERE device_id IN (
            SELECT id FROM devices
            WHERE organization_id IN (
                SELECT id FROM organizations WHERE name = 'Demo Organization'
            )
        )
    """))
    conn.execute(sa.text("""
        DELETE FROM device_commands
        WHERE device_id IN (
            SELECT id FROM devices
            WHERE organization_id IN (
                SELECT id FROM organizations WHERE name = 'Demo Organization'
            )
        )
    """))
    conn.execute(sa.text("""
        DELETE FROM alerts
        WHERE organization_id IN (
            SELECT id FROM organizations WHERE name = 'Demo Organization'
        )
    """))
    conn.execute(sa.text("""
        DELETE FROM organization_settings
        WHERE organization_id IN (
            SELECT id FROM organizations WHERE name = 'Demo Organization'
        )
    """))
    conn.execute(sa.text("""
        DELETE FROM devices
        WHERE organization_id IN (
            SELECT id FROM organizations WHERE name = 'Demo Organization'
        )
    """))
    conn.execute(sa.text(
        "DELETE FROM organizations WHERE name = 'Demo Organization'"
    ))

    # 2. Create SEPL Cold Storage organisation (idempotent)
    conn.execute(sa.text("""
        INSERT INTO organizations (id, name, region)
        VALUES (:id, 'SEPL Cold Storage', 'ap-south-1')
        ON CONFLICT (id) DO NOTHING
    """), {"id": ORG_ID})

    # 3. Create default org settings
    conn.execute(sa.text("""
        INSERT INTO organization_settings (
            organization_id, organization_name,
            warning_temperature_c, danger_temperature_c,
            refresh_interval_seconds, heartbeat_interval_minutes
        )
        VALUES (:org_id, 'SEPL Cold Storage', -15, -10, 5, 5)
        ON CONFLICT (organization_id) DO NOTHING
    """), {"org_id": ORG_ID})

    # 4. Register ESP32 device
    conn.execute(sa.text("""
        INSERT INTO devices (id, organization_id, name, status, thing_name)
        VALUES (:id, :org_id, 'Smart Cold Box - 01', 'offline', 'esp32_sepl_01')
        ON CONFLICT (id) DO NOTHING
    """), {"id": DEVICE_ID, "org_id": ORG_ID})


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("DELETE FROM devices WHERE id = :id"), {"id": DEVICE_ID})
    conn.execute(sa.text(
        "DELETE FROM organization_settings WHERE organization_id = :id"
    ), {"id": ORG_ID})
    conn.execute(sa.text("DELETE FROM organizations WHERE id = :id"), {"id": ORG_ID})
