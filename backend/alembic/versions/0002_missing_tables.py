"""Add missing tables: gateways, work_orders, dispatch, inventory, produce,
notifications, alert_rules, organization_settings.

Revision ID: 0002_missing_tables
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "0002_missing_tables"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Organization Settings ────────────────────────────────────────────────
    op.create_table(
        "organization_settings",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("organization_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False, unique=True),
        sa.Column("heartbeat_interval_minutes", sa.Integer, nullable=False, server_default="5"),
        sa.Column("alert_retention_days", sa.Integer, nullable=False, server_default="90"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_org_settings_org_id", "organization_settings", ["organization_id"])

    # ── Gateways ─────────────────────────────────────────────────────────────
    op.create_table(
        "gateways",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("organization_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("facility_id", sa.String(100), nullable=False, server_default="SEPL-NORTH"),
        sa.Column("ip", sa.String(45)),
        sa.Column("fw", sa.String(50)),
        sa.Column("status", sa.String(20), nullable=False, server_default="Online"),
        sa.Column("uptime", sa.String(20)),
        sa.Column("device_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("last_sync", sa.String(50)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_gateways_org_id", "gateways", ["organization_id"])

    # ── Work Orders ───────────────────────────────────────────────────────────
    op.create_table(
        "work_orders",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("organization_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("asset", sa.String(100), nullable=False),
        sa.Column("priority", sa.String(20), nullable=False, server_default="Medium"),
        sa.Column("status", sa.String(30), nullable=False, server_default="Open"),
        sa.Column("assignee", sa.String(100)),
        sa.Column("due", sa.String(50)),
        sa.Column("sla", sa.String(20), nullable=False, server_default="On Track"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_work_orders_org_id", "work_orders", ["organization_id"])

    # ── Dispatch ──────────────────────────────────────────────────────────────
    op.create_table(
        "dispatch",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("organization_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("vehicle", sa.String(50), nullable=False),
        sa.Column("reefer", sa.String(20), nullable=False, server_default="-18C"),
        sa.Column("driver", sa.String(100), nullable=False),
        sa.Column("dest", sa.String(255), nullable=False),
        sa.Column("load", sa.String(100)),
        sa.Column("eta", sa.String(50)),
        sa.Column("status", sa.String(30), nullable=False, server_default="Scheduled"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_dispatch_org_id", "dispatch", ["organization_id"])

    # ── Inventory ─────────────────────────────────────────────────────────────
    op.create_table(
        "inventory",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("organization_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("product", sa.String(255), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("chamber", sa.String(50), nullable=False),
        sa.Column("pallets", sa.Integer, nullable=False, server_default="1"),
        sa.Column("weight", sa.String(30)),
        sa.Column("received", sa.String(50)),
        sa.Column("expiry", sa.String(50)),
        sa.Column("status", sa.String(30), nullable=False, server_default="In Stock"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_inventory_org_id", "inventory", ["organization_id"])

    # ── Produce ───────────────────────────────────────────────────────────────
    op.create_table(
        "produce",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("organization_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("category", sa.String(30), nullable=False, server_default="Fruit"),
        sa.Column("variety", sa.String(100), nullable=False),
        sa.Column("chamber", sa.String(50), nullable=False),
        sa.Column("temp_required", sa.String(30), nullable=False),
        sa.Column("pallets", sa.Integer, nullable=False, server_default="1"),
        sa.Column("weight", sa.String(30)),
        sa.Column("origin", sa.String(100), nullable=False),
        sa.Column("expiry", sa.String(50), nullable=False),
        sa.Column("quality", sa.String(30), nullable=False, server_default="Fresh"),
        sa.Column("current_temp", sa.Float),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_produce_org_id", "produce", ["organization_id"])

    # ── Notifications ─────────────────────────────────────────────────────────
    op.create_table(
        "notifications",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("organization_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("type", sa.String(30), nullable=False, server_default="info"),
        sa.Column("is_read", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_notifications_org_id", "notifications", ["organization_id"])
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])

    # ── Alert Rules ───────────────────────────────────────────────────────────
    op.create_table(
        "alert_rules",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("organization_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("metric", sa.String(30), nullable=False),
        sa.Column("operator", sa.String(10), nullable=False, server_default=">"),
        sa.Column("threshold", sa.Float, nullable=False),
        sa.Column("severity", sa.String(20), nullable=False, server_default="Medium"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("device_id", UUID(as_uuid=True), sa.ForeignKey("devices.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_alert_rules_org_id", "alert_rules", ["organization_id"])


def downgrade() -> None:
    op.drop_table("alert_rules")
    op.drop_table("notifications")
    op.drop_table("produce")
    op.drop_table("inventory")
    op.drop_table("dispatch")
    op.drop_table("work_orders")
    op.drop_table("gateways")
    op.drop_table("organization_settings")
