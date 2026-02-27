/**
 * OpenTelemetry auto-instrumentation bootstrap.
 *
 * Platform-agnostic: swap the exporter for any backend.
 *  - Local:   otel-collector → console logs
 *  - Azure:   Azure Monitor exporter
 *  - AWS:     AWS X-Ray exporter
 *  - GCP:     Cloud Trace exporter
 *
 * Import this file BEFORE any other imports in server.ts / worker.ts
 * to ensure all auto-instrumentations are registered.
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4317',
});

const metricReader = new PeriodicExportingMetricReader({
  exporter: new OTLPMetricExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4317',
  }),
  exportIntervalMillis: 30_000,
});

const sdk = new NodeSDK({
  serviceName: process.env.OTEL_SERVICE_NAME ?? 'ardine',
  traceExporter,
  metricReader,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Auto-instrument Express, pg, ioredis, http, fetch
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown().then(
    () => console.log('OTel SDK shut down'),
    (err) => console.error('OTel SDK shutdown error', err)
  );
});

export { sdk };
