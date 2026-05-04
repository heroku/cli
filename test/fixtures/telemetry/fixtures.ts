import {TelemetryDrain} from '../../../src/lib/types/telemetry.js'

export const spaceTelemetryDrain1: TelemetryDrain = {
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
}

export const appTelemetryDrain1: TelemetryDrain = {
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
}

export const appTelemetryDrain2: TelemetryDrain = {
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
}

export const grpcAppTelemetryDrain: TelemetryDrain = {
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
}

export const splunkAppTelemetryDrain: TelemetryDrain = {
  exporter: {
    endpoint: 'https://splunk.example.com/services/collector',
    headers: {
      Authorization: 'Splunk your-hec-token',
    },
    type: 'splunk',
  },
  id: '6fa85f64-5717-4562-b3fc-2c963f66afa6',
  owner: {id: '845c1486-ad78-4de7-8da7-20d4f8b15b71', type: 'app'},
  signals: ['traces', 'metrics', 'logs'],
}
