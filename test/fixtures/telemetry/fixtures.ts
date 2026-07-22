import type {TelemetryDrain} from '@heroku/types/3.sdk'

export const spaceTelemetryDrain1: TelemetryDrain = {
  created_at: '2024-01-01T00:00:00Z',
  exporter: {
    endpoint: 'https://api.honeycomb.io/',
    /* eslint-disable perfectionist/sort-objects */
    headers: {
      'x-honeycomb-team': 'your-api-key',
      'x-honeycomb-dataset': 'your-dataset',
    },
    /* eslint-enable perfectionist/sort-objects */
    type: 'otlphttp',
  },
  id: '44444321-5717-4562-b3fc-2c963f66afa6',
  owner: {id: '12345678-5717-4562-b3fc-2c963f66afa6', type: 'space'},
  signals: ['traces', 'metrics', 'logs'],
  updated_at: '2024-01-01T00:00:00Z',
}

export const appTelemetryDrain1: TelemetryDrain = {
  created_at: '2024-01-01T00:00:00Z',
  exporter: {
    endpoint: 'https://api.honeycomb.io/',
    /* eslint-disable perfectionist/sort-objects */
    headers: {
      'x-honeycomb-team': 'your-api-key',
      'x-honeycomb-dataset': 'your-dataset',
    },
    /* eslint-enable perfectionist/sort-objects */
    type: 'otlphttp',
  },
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  owner: {id: '87654321-5717-4562-b3fc-2c963f66afa6', type: 'app'},
  signals: ['traces', 'metrics'],
  updated_at: '2024-01-01T00:00:00Z',
}

export const appTelemetryDrain2: TelemetryDrain = {
  created_at: '2024-01-01T00:00:00Z',
  exporter: {
    endpoint: 'https://api.papertrail.com/',
    /* eslint-disable perfectionist/sort-objects */
    headers: {
      'x-papertrail-team': 'your-api-key',
      'x-papertrail-dataset': 'your-dataset',
    },
    /* eslint-enable perfectionist/sort-objects */
    type: 'otlp',
  },
  id: '55555f64-5717-4562-b3fc-2c963f66afa6',
  owner: {id: '87654321-5717-4562-b3fc-2c963f66afa6', type: 'app'},
  signals: ['logs'],
  updated_at: '2024-01-01T00:00:00Z',
}

export const grpcAppTelemetryDrain: TelemetryDrain = {
  created_at: '2024-01-01T00:00:00Z',
  exporter: {
    endpoint: 'https://api.honeycomb.io/',
    /* eslint-disable perfectionist/sort-objects */
    headers: {
      'x-honeycomb-team': 'your-api-key',
      'x-honeycomb-dataset': 'your-dataset',
    },
    /* eslint-enable perfectionist/sort-objects */
    type: 'otlp',
  },
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  owner: {id: '745c1486-ad78-4de7-8da7-20d4f8b15b71', type: 'app'},
  signals: ['traces', 'metrics', 'logs'],
  updated_at: '2024-01-01T00:00:00Z',
}

export const splunkAppTelemetryDrain: TelemetryDrain = {
  created_at: '2024-01-01T00:00:00Z',
  exporter: {
    endpoint: 'https://splunk.example.com/services/collector',
    headers: {
      Authorization: 'Splunk your-hec-token',
    },
    type: 'splunk',
  } as unknown as TelemetryDrain['exporter'],
  id: '6fa85f64-5717-4562-b3fc-2c963f66afa6',
  owner: {id: '845c1486-ad78-4de7-8da7-20d4f8b15b71', type: 'app'},
  signals: ['traces', 'metrics', 'logs'],
  updated_at: '2024-01-01T00:00:00Z',
}
