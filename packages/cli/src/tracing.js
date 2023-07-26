// // Example filename: tracing.js
// 'use strict'
// const opentelemetry = require('@opentelemetry/api')
// const {HoneycombSDK} = require('@honeycombio/opentelemetry-node')
// const {
//   getNodeAutoInstrumentations,
// } = require('@opentelemetry/auto-instrumentations-node')
// const {OTLPTraceExporter} = require('@opentelemetry/exporter-trace-otlp-proto')
// const traceExporter = new OTLPTraceExporter()

// // Uses environment variables named HONEYCOMB_API_KEY and OTEL_SERVICE_NAME
// const sdk = new HoneycombSDK({
//   apiKey: 'your-api-key',
//   serviceName: 'your-service-name',
//   endpoint: 'http://localhost:3333/',
//   traceExporter,
//   instrumentations: [getNodeAutoInstrumentations({
//     // We recommend disabling fs automatic instrumentation because
//     // it can be noisy and expensive during startup
//     '@opentelemetry/instrumentation-fs': {
//       enabled: false,
//     },
//   })],
// })

// sdk.start()

// const tracer = opentelemetry.trace.getTracer('heroku-cli-tracer')
// tracer.startActiveSpan('command.name.test', span => {
//   span.setAttribute('user.id', 'zane-n-mars')
//   span.end()
// })

// // // gracefully shut down the SDK on process exit
// // process.on('beforeExit', () => {
// //   sdk.shutdown()
// //     .then(() => console.log('Tracing terminated'))
// //     .catch((error) => console.log('Error terminating tracing', error))
// //     .finally(() => process.exit(0))
// // })

