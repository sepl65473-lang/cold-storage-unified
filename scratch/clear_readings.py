import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

# Production Credentials
DB_URL = "postgresql+asyncpg://cold_storage_user:c0CCSJfIbY68DqHZcjt3SkIJHRXkSuXr@cold-storage-prod.ck5qui62i949.us-east-1.rds.amazonaws.com:5432/cold_storage"

async def clear_readings():
    engine = create_async_engine(DB_URL)
    async with AsyncSession(engine) as session:
        print("Connecting to Production DB...")
        
        # Clear all sensor readings
        await session.execute(text("TRUNCATE TABLE sensor_readings CASCADE"))
        await session.commit()
        print("SUCCESS: sensor_readings table cleared.")

if __name__ == "__main__":
    asyncio.run(clear_readings())
