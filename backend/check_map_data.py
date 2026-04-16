import asyncio
from sqlalchemy import select
from app.db.session import engine
from app.models.device import Device
from app.models.user import Organization

async def check():
    async with engine.connect() as conn:
        res = await conn.execute(select(Device))
        devices = res.fetchall()
        print(f"Total Devices in DB: {len(devices)}")
        for d in devices:
            print(f"Device: {d.name}, ID: {d.id}, Lat: {d.location_lat}, Lng: {d.location_lng}")

if __name__ == "__main__":
    asyncio.run(check())
