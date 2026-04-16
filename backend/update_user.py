import asyncio
from sqlalchemy import update
from app.db.session import engine
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, Organization
from app.models.device import Device
from app.models.sensor_reading import SensorReading
from app.models.alert import Alert
from app.models.audit_log import AuditLog

async def update_password():
    async with AsyncSession(engine) as session:
        new_hash = "$2b$12$HxWCx0uUjgbvkL2A/UB5IOcBOyTT4KaKHJMfr4J..yvceWX4gqD1a"
        q = update(User).where(User.email == "admin@example.com").values(password_hash=new_hash)
        await session.execute(q)
        await session.commit()
        print("Updated admin password hash.")

if __name__ == "__main__":
    asyncio.run(update_password())
