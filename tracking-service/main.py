import os
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
import py_eureka_client.eureka_client as eureka_client

from config.database import connect_db, close_db
from controllers.tracking_controller import router
from kafka.location_consumer import start_kafka_listeners

app = FastAPI(title="Qrib Lik Tracking Service")

# Environment variables
EUREKA_HOST = os.getenv("EUREKA_HOST", "localhost")
EUREKA_PORT = os.getenv("EUREKA_PORT", "8761")
INSTANCE_HOST = os.getenv("INSTANCE_HOST", "localhost")
PORT = int(os.getenv("PORT", "8085"))

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Swagger
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Qrib Lik Tracking API",
        version="1.0.0",
        description="Documentation pour le service de suivi GPS en temps réel",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

app.include_router(router, prefix="/api/v1/tracking")

@app.on_event("startup")
async def startup():
    await connect_db()

    # Eureka registration
    eureka_url = f"http://{EUREKA_HOST}:{EUREKA_PORT}/eureka"
    print(f"🔗 Registering to Eureka at: {eureka_url}")

    await eureka_client.init_async(
        eureka_server=eureka_url,
        app_name="TRACKING-SERVICE",
        instance_port=PORT,
        instance_id=f"tracking-service:{PORT}",
        instance_host=INSTANCE_HOST,
        should_register=True,
        renewal_interval_in_secs=10
    )

    # Kafka
    asyncio.create_task(start_kafka_listeners())

@app.on_event("shutdown")
async def shutdown():
    await close_db()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)