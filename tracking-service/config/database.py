from motor.motor_asyncio import AsyncIOMotorClient

class Database:
    def __init__(self):
        self.client: AsyncIOMotorClient = None
        self._db = None

    @property
    def db(self):
        # هاد السطر كيضمن لينا أننا ديما كنرجعو الـ database object من الـ client
        if self.client:
            return self.client.qriblik_tracking_db
        return None

db_helper = Database()

async def connect_db():
    try:
        db_helper.client = AsyncIOMotorClient("mongodb://localhost:27017")
        # كنحاولوا نديروا شي عملية بسيطة باش نتأكدوا من الاتصال
        await db_helper.client.admin.command('ping')
        print("✅ MongoDB Connected: qriblik_tracking_db")
    except Exception as e:
        print(f"❌ Error connecting to MongoDB: {e}")

async def close_db():
    if db_helper.client:
        db_helper.client.close()