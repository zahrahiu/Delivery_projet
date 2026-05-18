# tracing.py
import os
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.zipkin.proto.http import ZipkinExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.sdk.resources import SERVICE_NAME, Resource

def setup_tracing(app, service_name: str):
    """Configurer Zipkin tracing pour FastAPI"""

    # URL ديال Zipkin (من البيئة ولا localhost)
    zipkin_url = os.getenv("ZIPKIN_URL", "http://zipkin:9411/api/v2/spans")

    # إعداد Resource مع اسم الخدمة
    resource = Resource(attributes={
        SERVICE_NAME: service_name
    })

    # إعداد Tracer Provider
    provider = TracerProvider(resource=resource)

    # إعداد Zipkin Exporter
    zipkin_exporter = ZipkinExporter(
        endpoint=zipkin_url,
    )

    # إضافة Span Processor
    provider.add_span_processor(BatchSpanProcessor(zipkin_exporter))

    # تعيين الـ provider كـ provider رئيسي
    trace.set_tracer_provider(provider)

    # تفعيل instrumentation لـ FastAPI
    FastAPIInstrumentor.instrument_app(app)

    # تفعيل instrumentation لـ requests (للاستدعاءات HTTP)
    RequestsInstrumentor().instrument()

    print(f"✅ Zipkin tracing initialized for {service_name}")
    print(f"   Zipkin endpoint: {zipkin_url}")

    return trace.get_tracer(service_name)