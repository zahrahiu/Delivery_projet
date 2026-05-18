import os
import asyncio
import time
import logging
from fastapi import FastAPI, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from pythonjsonlogger import jsonlogger
from opentelemetry import trace #lier zipkin avec elk

import py_eureka_client.eureka_client as eureka_client
from prometheus_client import generate_latest, REGISTRY, CONTENT_TYPE_LATEST

from tracing import setup_tracing
from config.database import connect_db, close_db
from controllers.tracking_controller import router
from kafka.location_consumer import start_kafka_listeners

app = FastAPI(title="Qrib Lik Tracking Service")

# 2.  ELK Logging (Structured JSON Logging)
logger = logging.getLogger("tracking-service-logger")
logHandler = logging.StreamHandler()

##forma json pour indexing f elksearche

formatter = jsonlogger.JsonFormatter('%(asctime)s %(levelname)s %(name)s %(message)s')
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)

service_name = os.getenv("OTEL_SERVICE_NAME", "tracking-service")
tracer = setup_tracing(app, service_name)

# 4. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Middleware للربط بين Zipkin و ELK (Trace-Log Correlation)
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()

    response = await call_next(request)

    process_time = (time.time() - start_time) * 1000

#njib trace id d zipkin
    current_span = trace.get_current_span()
    trace_id = format(current_span.get_span_context().trace_id, '032x') if current_span else "no-trace"

    logger.info("HTTP Request Processed", extra={
        "method": request.method,
        "url": str(request.url),
        "status_code": response.status_code,
        "duration_ms": round(process_time, 2),
        "trace_id": trace_id,
        "service": "tracking-service",
        "project": "Qrib Lik"
    })
    return response

# Variables d'environnement
EUREKA_HOST = os.getenv("EUREKA_HOST", "localhost")
EUREKA_PORT = os.getenv("EUREKA_PORT", "8761")
INSTANCE_HOST = os.getenv("INSTANCE_HOST", "localhost")
PORT = int(os.getenv("PORT", "8085"))

# 6. Prometheus Metrics Endpoint
@app.get("/metrics")
async def metrics():
    return Response(
        content=generate_latest(REGISTRY),
        media_type=CONTENT_TYPE_LATEST
    )

# 7. Swagger / OpenAPI Configuration
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
            "type": "http", "scheme": "bearer", "bearerFormat": "JWT"
        }
    }
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# 8. Routes
app.include_router(router, prefix="/api/v1/tracking")

@app.get("/health")
async def health_check():
    with tracer.start_as_current_span("health-check"):
        return {"status": "healthy"}

# 9. Lifecycle Events (Startup & Shutdown)
@app.on_event("startup")
async def startup():
    with tracer.start_as_current_span("startup"):
        await connect_db()

        # Eureka registration
        eureka_url = f"http://{EUREKA_HOST}:{EUREKA_PORT}/eureka"
        print(f"🔗 Registering to Eureka at: {eureka_url}")

        try:
            await eureka_client.init_async(
                eureka_server=eureka_url,
                app_name="TRACKING-SERVICE",
                instance_port=PORT,
                instance_id=f"tracking-service:{PORT}",
                instance_host=INSTANCE_HOST,
                should_register=True,
                renewal_interval_in_secs=10
            )
        except Exception as e:
            logger.error(f"Eureka connection failed: {e}")

        # Kafka listeners
        asyncio.create_task(start_kafka_listeners())

@app.on_event("shutdown")
async def shutdown():
    await close_db()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)