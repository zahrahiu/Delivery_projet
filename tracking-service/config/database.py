import os
from motor.motor_asyncio import AsyncIOMotorClient

class Database:
    def __init__(self):
        self.client: AsyncIOMotorClient = None
        self._db = None

    @property
    def db(self):
        if self.client:
            return self.client.qriblik_tracking_db
        return None

db_helper = Database()

async def connect_db():
    try:
        # قراءة من environment variables
        MONGO_HOST = os.getenv("DB_HOST", "localhost")
        MONGO_PORT = os.getenv("DB_PORT", "27017")
        MONGO_URI = f"mongodb://{MONGO_HOST}:{MONGO_PORT}"

        db_helper.client = AsyncIOMotorClient(MONGO_URI)
        await db_helper.client.admin.command('ping')
        print(f"✅ MongoDB Connected: qriblik_tracking_db at {MONGO_URI}")
    except Exception as e:
        print(f"❌ Error connecting to MongoDB: {e}")

async def close_db():
    if db_helper.client:
        db_helper.client.close()