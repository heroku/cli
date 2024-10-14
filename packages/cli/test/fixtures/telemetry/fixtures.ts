export const addAllDrainsConfig = {
  signals: ['traces', 'metrics', 'logs'],
  exporter: {
    endpoint: 'https://api.testendpoint.com',
    transport: 'otlphttp',
  },
}
