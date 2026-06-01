import * as Heroku from '@heroku-cli/schema'

import type {SpaceTopology, SpaceWithOutboundIps} from '../../../src/lib/types/spaces.js'

export const spaces: Record<string, SpaceWithOutboundIps> = {
  'allocating-space': {
    cidr: '10.0.0.0/16',
    created_at: '2016-01-06T03:23:13Z',
    data_cidr: '172.23.0.0/20',
    generation: 'cedar',
    id: '1234',
    name: 'my-unshielded-space',
    organization: {
      name: 'my-org',
    },
    region: {
      description: 'virginia',
      id: '1',
      name: 'us',
    },
    shield: false,
    state: 'allocating',
    team: {
      name: 'my-team',
    },
    updated_at: '2016-01-06T03:23:13Z',
  },
  'non-shield-space': {
    cidr: '10.0.0.0/16',
    created_at: '2016-01-06T03:23:13Z',
    data_cidr: '172.23.0.0/20',
    generation: 'cedar',
    id: '1234',
    name: 'my-unshielded-space',
    organization: {
      name: 'my-org',
    },
    region: {
      description: 'virginia',
      id: '1',
      name: 'us',
    },
    shield: false,
    state: 'allocated',
    team: {
      name: 'my-team',
    },
    updated_at: '2016-01-06T03:23:13Z',
  },

  'shield-space': {
    cidr: '10.0.0.0/16',
    created_at: '2016-01-06T03:23:13Z',
    data_cidr: '172.23.0.0/20',
    generation: 'cedar',
    id: '1234',
    name: 'my-shielded-space',
    organization: {
      name: 'my-org',
    },
    region: {
      description: 'virginia',
      id: '1',
      name: 'us',
    },
    shield: true,
    state: 'allocated',
    team: {
      name: 'my-team',
    },
    updated_at: '2016-01-06T03:23:13Z',
  },
}

export const apps: Record<string, Heroku.App> = {
  www: {
    id: 'a84b035c-4c83-11e5-9bda-2cf0ee2c94de',
    name: 'acme-inc-www',
  },
}

export const topologies: Record<string, SpaceTopology> = {
  'topology-one': {
    apps: [
      {
        domains: ['example.com', 'example.net'],
        formations: [
          {
            dynos: [
              {
                hostname: '1.example-app-90210.app.localspace',
                number: 1,
                private_ip: '10.0.134.42',
              },
              {
                hostname: '1.example-app-90210.app.localspace',
                number: 2,
                private_ip: '10.0.134.42',
              },
            ],
            process_type: 'web',
          },
        ],
        id: apps.www.id,
      },
    ],
    version: 1,
  },
  'topology-three': {
    apps: [
      {
        domains: ['example.com', 'example.net'],
        formations: [
          {
            dynos: [
              {
                hostname: '1.example-app-90210.app.localspace',
                number: 1,
                private_ip: '10.0.134.42',
              },
              {
                hostname: '1.example-app-90210.app.localspace',
                number: 1,
                private_ip: '10.0.134.42',
              },
            ],
            process_type: 'web',
          },
        ],
        id: apps.www.id,
      },
    ],
    version: 1,
  },
  'topology-two': {
    apps: [
      {
        domains: ['example.com', 'example.net'],
        formations: [
          {
            dynos: [
              {
                hostname: '1.example-app-90210.app.localspace',
                number: 2,
                private_ip: '10.0.134.42',
              },
              {
                hostname: '1.example-app-90210.app.localspace',
                number: 1,
                private_ip: '10.0.134.42',
              },
            ],
            process_type: 'web',
          },
        ],
        id: apps.www.id,
      },
    ],
    version: 1,
  },
}
