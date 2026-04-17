import asyncio
import uuid
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

# Production Credentials
DB_URL = "postgresql+asyncpg://cold_storage_user:c0CCSJfIbY68DqHZcjt3SkIJHRXkSuXr@cold-storage-prod.ck5qui62i949.us-east-1.rds.amazonaws.com:5432/cold_storage"

async def check_readings():
    engine = create_async_engine(DB_URL)
    async with AsyncSession(engine) as session:
        print("Connecting to Production DB...")
        
        # Check latest 5 readings
        res = await session.execute(text(
            "SELECT time, device_id, temperature, humidity FROM sensor_readings "
            "ORDER BY time DESC LIMIT 5"
        ))
        readings = res.all()
        
        if not readings:
            print("No readings found in the database.")
        else:
            print("Latest 5 readings:")
            for r in readings:
                print(f"Time: {r.time} | Device: {r.device_id} | Temp: {r.temperature}°C | Hum: {r.humidity}%")

if __name__ == "__main__":
    asyncio.run(check_readings())
