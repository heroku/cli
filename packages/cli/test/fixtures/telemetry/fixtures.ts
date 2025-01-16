import {TelemetryDrain} from '../../../src/lib/types/telemetry'

export const spaceTelemetryDrain1: TelemetryDrain = {
  id: '44444321-5717-4562-b3fc-2c963f66afa6',
  owner: {id: '12345678-5717-4562-b3fc-2c963f66afa6', type: 'space', name: 'myspace'},
  signals: ['traces', 'metrics', 'logs'],
  exporter: {
    type: 'otlphttp',
    endpoint: 'https://api.honeycomb.io/',
    headers: {
      'x-honeycomb-team': 'your-api-key',
      'x-honeycomb-dataset': 'your-dataset',
    },
  },
}

export const appTelemetryDrain1: TelemetryDrain = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  owner: {id: '87654321-5717-4562-b3fc-2c963f66afa6', type: 'app', name: 'myapp'},
  signals: ['traces', 'metrics'],
  exporter: {
    type: 'otlphttp',
    endpoint: 'https://api.honeycomb.io/',
    headers: {
      'x-honeycomb-team': 'your-api-key',
      'x-honeycomb-dataset': 'your-dataset',
    },
  },
}

export const appTelemetryDrain2: TelemetryDrain = {
  id: '55555f64-5717-4562-b3fc-2c963f66afa6',
  owner: {id: '87654321-5717-4562-b3fc-2c963f66afa6', type: 'app', name: 'myapp'},
  signals: ['logs'],
  exporter: {
    type: 'otlp',
    endpoint: 'https://api.papertrail.com/',
    headers: {
      'x-papertrail-team': 'your-api-key',
      'x-papertrail-dataset': 'your-dataset',
    },
  },
}

export const grpcAppTelemetryDrain: TelemetryDrain = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  owner: {id: '745c1486-ad78-4de7-8da7-20d4f8b15b71', type: 'app', name: 'myapp'},
  signals: ['traces', 'metrics', 'logs'],
  exporter: {
    type: 'otlp',
    endpoint: 'https://api.honeycomb.io/',
    headers: {
      'x-honeycomb-team': 'your-api-key',
      'x-honeycomb-dataset': 'your-dataset',
    },
  },
}
