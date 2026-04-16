"""Seed initial organization and admin user."""
import asyncio
import uuid
from sqlalchemy import select
from app.db.session import engine
from sqlalchemy.ext.asyncio import AsyncSession

# Import ALL models to avoid SQLAlchemy relationship resolution errors
from app.models.user import User, Organization, UserRole
from app.models.device import Device
from app.models.sensor_reading import SensorReading
from app.models.alert import Alert
from app.models.audit_log import AuditLog

async def seed():
    async with AsyncSession(engine) as session:
        # Check if Org exists
        org_q = await session.execute(select(Organization).where(Organization.name == "Demo Organization"))
        org = org_q.scalar_one_or_none()
        
        if not org:
            org = Organization(
                id=uuid.uuid4(),
                name="Demo Organization",
                region="us-east-1"
            )
            session.add(org)
            await session.flush()
            print(f"Created Org: {org.id}")
        else:
            print(f"Org already exists: {org.id}")

        # Check if Admin exists
        user_q = await session.execute(select(User).where(User.email == "admin@example.com"))
        user = user_q.scalar_one_or_none()
        
        if not user:
            # Pre-hashed bcrypt for 'password123!'
            # This avoids bcrypt runtime issues in some docker environments
            static_hash = "$2b$12$HxWCx0uUjgbvkL2A/UB5IOcBOyTT4KaKHJMfr4J..yvceWX4gqD1a"
            
            user = User(
                id=uuid.uuid4(),
                organization_id=org.id,
                email="admin@example.com",
                email_encrypted="[ENCRYPTED_EMAIL]",
                password_hash=static_hash,
                role=UserRole.SUPERADMIN,
                is_active=True
            )
            session.add(user)
            print(f"Created Admin: {user.email}")
        else:
            print(f"Admin already exists: {user.email}")
        
        await session.commit()
        print("Seed process finished.")

if __name__ == "__main__":
    try:
        asyncio.run(seed())
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Seed Error: {e}")
