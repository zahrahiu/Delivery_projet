import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
import py_eureka_client.eureka_client as eureka_client

from config.database import connect_db, close_db
from controllers.tracking_controller import router
from kafka.location_consumer import start_kafka_listeners

app = FastAPI(title="Qrib Lik Tracking Service")

# 1. إعدادات CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. تخصيص Swagger لدعم JWT (Bearer Token)
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Qrib Lik Tracking API",
        version="1.0.0",
        description="Documentation pour le service de suivi GPS en temps réel",
        routes=app.routes,
    )
    # إضافة تعريف Security Scheme
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    # ربط الحماية بجميع المسارات التي تحتاج توثيق
    for path in openapi_schema["paths"]:
        for method in openapi_schema["paths"][path]:
            # نضيف خيار الحماية فقط للمسارات التي نحددها في الـ Controller
            pass

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# 3. تضمين الـ Routers
app.include_router(router, prefix="/api/v1/tracking")

@app.on_event("startup")
async def startup():
    await connect_db()
    # التسجيل في Eureka
    await eureka_client.init_async(
        eureka_server="http://localhost:8761/eureka",
        app_name="TRACKING-SERVICE",
        instance_port=8085,
        instance_id=f"tracking-service:8085",
        instance_host="localhost",
        should_register=True,
        renewal_interval_in_secs=10
    )
    # تشغيل Kafka في الخلفية
    asyncio.create_task(start_kafka_listeners())

@app.on_event("shutdown")
async def shutdown():
    await close_db()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8085, reload=True)