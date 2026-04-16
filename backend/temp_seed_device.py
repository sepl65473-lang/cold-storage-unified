import asyncio
import uuid
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import Organization
from app.models.device import Device

async def seed_device():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Organization).where(Organization.name == 'Demo Organization'))
        org = res.scalar_one_or_none()
        if not org:
            print('Demo Organization not found')
            return
        
        device = Device(
            id=uuid.UUID('d1e2b3c4-a5b6-4c7d-8e9f-0a1b2c3d4e5f'),
            organization_id=org.id,
            name='Smart Cold Box - 01',
            location_lat=28.6139,
            location_lng=77.2090,
            location_label='New Delhi Hub',
            thing_name='demo_device_01'
        )
        
        # Check if already exists
        check_res = await db.execute(select(Device).where(Device.thing_name == 'demo_device_01'))
        if check_res.scalar_one_or_none():
            print('Device demo_device_01 already exists')
        else:
            db.add(device)
            await db.commit()
            print(f'Device seeded: {device.id}')

if __name__ == "__main__":
    asyncio.run(seed_device())
