import asyncio
from app.db.session import engine
from sqlalchemy import text

async def get_org_id():
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT id FROM organizations WHERE name='Demo Organization' LIMIT 1"))
        val = res.scalar()
        print(f"ORG_ID:{val}")

if __name__ == "__main__":
    asyncio.run(get_org_id())
