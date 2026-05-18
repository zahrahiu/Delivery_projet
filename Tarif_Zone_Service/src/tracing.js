// tracing.js
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { ZipkinExporter } = require('@opentelemetry/exporter-zipkin');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');

const zipkinExporter = new ZipkinExporter({
    url: process.env.ZIPKIN_URL || 'http://zipkin:9411/api/v2/spans',
});

const sdk = new NodeSDK({
    serviceName: process.env.OTEL_SERVICE_NAME || 'node-service',
    traceExporter: zipkinExporter,
    instrumentations: [
        new HttpInstrumentation(),
        new ExpressInstrumentation(),
    ]
});

sdk.start();

console.log(`✅ Zipkin tracing initialized for ${process.env.OTEL_SERVICE_NAME || 'node-service'}`);

process.on('SIGTERM', () => {
    sdk.shutdown()
        .then(() => console.log('Tracing terminated'))
        .catch((error) => console.error('Error terminating tracing', error))
        .finally(() => process.exit(0));
});