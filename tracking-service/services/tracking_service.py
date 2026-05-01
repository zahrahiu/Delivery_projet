from config.database import db_helper
from datetime import datetime
from fastapi import WebSocket

# 1. ConnectionManager: كيسير الاتصالات ديال الـ WebSocket
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict = {}

    async def connect(self, websocket: WebSocket, livreur_id: str):
        await websocket.accept()
        if livreur_id not in self.active_connections:
            self.active_connections[livreur_id] = []
        self.active_connections[livreur_id].append(websocket)

    def disconnect(self, websocket: WebSocket, livreur_id: str):
        if livreur_id in self.active_connections:
            self.active_connections[livreur_id].remove(websocket)

    async def broadcast(self, livreur_id: str, message: dict):
        if livreur_id in self.active_connections:
            for connection in self.active_connections[livreur_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"❌ Error broadcasting: {e}")

# 2. TrackingService: المنطق ديال التتبع
class TrackingService:
    manager = ConnectionManager()

    @staticmethod
    async def save_and_broadcast(dto):
        try:
            location_dict = {
                "livreur_id": str(dto.livreur_id),
                "latitude": float(dto.latitude),
                "longitude": float(dto.longitude),
                "parcel_id": str(dto.parcel_id),
                "timestamp": datetime.utcnow()
            }

            # صيفطي التحديث لـ WebSockets
            ws_payload = {**location_dict, "timestamp": location_dict["timestamp"].isoformat()}
            await TrackingService.manager.broadcast(str(dto.livreur_id), ws_payload)

            # حفظ فـ MongoDB
            if db_helper.db is not None:
                await db_helper.db.locations.insert_one(location_dict)

            return ws_payload
        except Exception as e:
            print(f"❌ Backend Error: {e}")
            raise e

    @staticmethod
    async def get_last_location(livreur_id: str):
        try:
            if db_helper.db is not None:
                # كنقلبوا بـ livreur_id وكنرتبوا بـ timestamp تنازلي باش نجيبو الأحدث
                last_loc = await db_helper.db.locations.find_one(
                    {"livreur_id": str(livreur_id)},
                    sort=[("timestamp", -1)]
                )

                if last_loc:
                    # تحويل الأوبجيكت لـ JSON-friendly
                    last_loc["_id"] = str(last_loc["_id"])
                    if isinstance(last_loc.get("timestamp"), datetime):
                        last_loc["timestamp"] = last_loc["timestamp"].isoformat()
                    return last_loc
            return None
        except Exception as e:
            print(f"❌ Error fetching last location: {e}")
            return None