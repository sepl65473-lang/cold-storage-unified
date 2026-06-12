"""Pydantic schemas for operations: gateways, work_orders, dispatch, inventory, produce,
notifications, alert_rules, roles, audit."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


# ─── Gateway ──────────────────────────────────────────────────────────────────

class GatewayBase(BaseModel):
    name: str
    facility_id: str = "SEPL-NORTH"
    ip: str | None = None
    fw: str | None = None
    status: str = "Online"
    uptime: str | None = None
    device_count: int = 0
    last_sync: str | None = None


class GatewayCreate(GatewayBase):
    pass


class GatewayUpdate(BaseModel):
    name: str | None = None
    facility_id: str | None = None
    ip: str | None = None
    fw: str | None = None
    status: str | None = None
    uptime: str | None = None


class GatewayResponse(GatewayBase):
    id: uuid.UUID
    organization_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}

    def model_post_init(self, __context: Any) -> None:
        # Alias for frontend
        object.__setattr__(self, "facility", self.facility_id)
        object.__setattr__(self, "devices", str(self.device_count))
        object.__setattr__(self, "lastSync", self.last_sync or "-")


# ─── Work Order ───────────────────────────────────────────────────────────────

class WorkOrderBase(BaseModel):
    title: str
    asset: str
    priority: str = "Medium"
    status: str = "Open"
    assignee: str | None = None
    due: str | None = None
    sla: str = "On Track"


class WorkOrderCreate(WorkOrderBase):
    pass


class WorkOrderUpdate(BaseModel):
    title: str | None = None
    asset: str | None = None
    priority: str | None = None
    status: str | None = None
    assignee: str | None = None
    due: str | None = None
    sla: str | None = None


class WorkOrderResponse(WorkOrderBase):
    id: uuid.UUID
    organization_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Dispatch ─────────────────────────────────────────────────────────────────

class DispatchBase(BaseModel):
    vehicle: str
    reefer: str = "-18C"
    driver: str
    dest: str
    load: str | None = None
    eta: str | None = None
    status: str = "Scheduled"


class DispatchCreate(DispatchBase):
    pass


class DispatchUpdate(BaseModel):
    vehicle: str | None = None
    reefer: str | None = None
    driver: str | None = None
    dest: str | None = None
    load: str | None = None
    eta: str | None = None
    status: str | None = None


class DispatchResponse(DispatchBase):
    id: uuid.UUID
    organization_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Inventory ────────────────────────────────────────────────────────────────

class InventoryBase(BaseModel):
    product: str
    category: str
    chamber: str
    pallets: int = 1
    weight: str | None = None
    received: str | None = None
    expiry: str | None = None
    status: str = "In Stock"


class InventoryCreate(InventoryBase):
    pass


class InventoryUpdate(BaseModel):
    product: str | None = None
    category: str | None = None
    chamber: str | None = None
    pallets: int | None = None
    weight: str | None = None
    expiry: str | None = None
    status: str | None = None


class InventoryResponse(InventoryBase):
    id: uuid.UUID
    organization_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True }


# ─── Produce ──────────────────────────────────────────────────────────────────

class ProduceBase(BaseModel):
    name: str
    category: str = "Fruit"
    variety: str
    chamber: str
    temp_required: str
    pallets: int = 1
    weight: str | None = None
    origin: str
    expiry: str
    quality: str = "Fresh"
    current_temp: float | None = None


class ProduceCreate(ProduceBase):
    pass


class ProduceUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    variety: str | None = None
    chamber: str | None = None
    temp_required: str | None = None
    pallets: int | None = None
    origin: str | None = None
    expiry: str | None = None
    quality: str | None = None


class ProduceResponse(ProduceBase):
    id: uuid.UUID
    organization_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}

    def model_post_init(self, __context: Any) -> None:
        object.__setattr__(self, "tempRequired", self.temp_required)
        object.__setattr__(self, "currentTemp", self.current_temp)


# ─── Notification ─────────────────────────────────────────────────────────────

class NotificationCreate(BaseModel):
    title: str
    message: str
    type: str = "info"
    user_id: uuid.UUID | None = None


class NotificationResponse(BaseModel):
    id: uuid.UUID
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Alert Rule ───────────────────────────────────────────────────────────────

class AlertRuleBase(BaseModel):
    name: str
    metric: str
    operator: str = ">"
    threshold: float
    severity: str = "Medium"
    is_active: bool = True
    device_id: uuid.UUID | None = None


class AlertRuleCreate(AlertRuleBase):
    pass


class AlertRuleUpdate(BaseModel):
    name: str | None = None
    metric: str | None = None
    operator: str | None = None
    threshold: float | None = None
    severity: str | None = None
    is_active: bool | None = None


class AlertRuleResponse(AlertRuleBase):
    id: uuid.UUID
    organization_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Audit Log ────────────────────────────────────────────────────────────────

class AuditLogResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID | None
    organization_id: uuid.UUID | None
    action: str
    resource_type: str
    resource_id: str | None
    details: dict | None
    ip_address: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Chamber (Create / Update) ────────────────────────────────────────────────

class ChamberCreate(BaseModel):
    name: str
    location_label: str | None = None


class ChamberUpdate(BaseModel):
    name: str | None = None
    location_label: str | None = None
    is_active: bool | None = None


# ─── User Update ──────────────────────────────────────────────────────────────

class UserUpdate(BaseModel):
    role: str | None = None
    is_active: bool | None = None
    phone: str | None = None
