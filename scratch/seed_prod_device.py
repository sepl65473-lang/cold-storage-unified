import asyncio
import uuid
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

# Production Credentials
DB_URL = "postgresql+asyncpg://cold_storage_user:c0CCSJfIbY68DqHZcjt3SkIJHRXkSuXr@cold-storage-prod.ck5qui62i949.us-east-1.rds.amazonaws.com:5432/cold_storage"

async def seed_prod():
    engine = create_async_engine(DB_URL)
    async with AsyncSession(engine) as session:
        print("Connecting to Production DB...")
        
        # 1. Get or Create Organization
        # Check if any org exists
        res = await session.execute(text("SELECT id FROM organizations LIMIT 1"))
        org_id = res.scalar()
        
        if not org_id:
            org_id = uuid.uuid4()
            await session.execute(text(
                "INSERT INTO organizations (id, name, region, is_active, created_at, updated_at) "
                "VALUES (:id, :name, :region, :active, NOW(), NOW())"
            ), {"id": org_id, "name": "Default Organization", "region": "us-east-1", "active": True})
            print(f"Created Default Org: {org_id}")
        else:
            print(f"Using existing Org: {org_id}")
            
        # 2. Seed the ESP32 Device
        device_id = uuid.UUID("d1e2b3c4-a5b6-4c7d-8e9f-0a1b2c3d4e5f")
        check_dev = await session.execute(text("SELECT id FROM devices WHERE id = :id"), {"id": device_id})
        
        if not check_dev.scalar():
            await session.execute(text(
                "INSERT INTO devices (id, organization_id, name, location_lat, location_lng, location_label, thing_name, created_at, updated_at) "
                "VALUES (:id, :org_id, :name, :lat, :lng, :label, :thing, NOW(), NOW())"
            ), {
                "id": device_id,
                "org_id": org_id,
                "name": "Smart Cold Box - 01",
                "lat": 28.6139,
                "lng": 77.2090,
                "label": "Main Hub",
                "thing": "esp32_test_node_01"
            })
            print(f"Successfully seeded Test Device: {device_id}")
        else:
            print(f"Device {device_id} already exists in Production.")
            
        await session.commit()
        print("Done.")

if __name__ == "__main__":
    asyncio.run(seed_prod())
