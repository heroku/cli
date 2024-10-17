export const spaceTelemetryDrain1 = {
  id: '44444321-5717-4562-b3fc-2c963f66afa6',
  owner: {id: '12345678-5717-4562-b3fc-2c963f66afa6', type: 'space', name: 'myspace'},
  capabilities: ['traces', 'metrics', 'logs'],
  exporter: {
    type: 'otlphttp',
    endpoint: 'https://api.honeycomb.io/',
    headers: {
      'x-honeycomb-team': 'your-api-key',
      'x-honeycomb-dataset': 'your-dataset',
    },
  },
}

export const appTelemetryDrain1 = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  owner: {id: '87654321-5717-4562-b3fc-2c963f66afa6', type: 'app', name: 'myapp'},
  capabilities: ['traces', 'metrics'],
  exporter: {
    type: 'otlphttp',
    endpoint: 'https://api.honeycomb.io/',
    headers: {
      'x-honeycomb-team': 'your-api-key',
      'x-honeycomb-dataset': 'your-dataset',
    },
  },
}

export const appTelemetryDrain2 = {
  id: '55555f64-5717-4562-b3fc-2c963f66afa6',
  owner: {id: '87654321-5717-4562-b3fc-2c963f66afa6', type: 'app', name: 'myapp'},
  capabilities: ['logs'],
  exporter: {
    type: 'otlphttp',
    endpoint: 'https://api.papertrail.com/',
    headers: {
      'x-papertrail-team': 'your-api-key',
      'x-papertrail-dataset': 'your-dataset',
    },
  },
}
