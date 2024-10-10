import * as Heroku from '@heroku-cli/schema'
import type {SpaceTopology} from '../../../src/commands/spaces/topology'
import {SpaceWithOutboundIps} from '../../../src/lib/types/spaces'

export const spaces: Record<string, SpaceWithOutboundIps> = {
  'non-shield-space': {
    id: '1234',
    name: 'my-unshielded-space',
    shield: false,
    region: {
      id: '1',
      description: 'virginia',
      name: 'us',
    },
    team: {
      name: 'my-team',
    },
    cidr: '10.0.0.0/16',
    data_cidr: '172.23.0.0/20',
    state: 'allocated',
    organization: {
      name: 'my-org',
    },
    generation: 'cedar',
    created_at: '2016-01-06T03:23:13Z',
    updated_at: '2016-01-06T03:23:13Z',
  },
  'shield-space': {
    id: '1234',
    name: 'my-shielded-space',
    shield: true,
    region: {
      id: '1',
      description: 'virginia',
      name: 'us',
    },
    team: {
      name: 'my-team',
    },
    cidr: '10.0.0.0/16',
    data_cidr: '172.23.0.0/20',
    state: 'allocated',
    organization: {
      name: 'my-org',
    },
    generation: 'cedar',
    created_at: '2016-01-06T03:23:13Z',
    updated_at: '2016-01-06T03:23:13Z',
  },

  'allocating-space': {
    id: '1234',
    name: 'my-unshielded-space',
    shield: false,
    region: {
      id: '1',
      description: 'virginia',
      name: 'us',
    },
    team: {
      name: 'my-team',
    },
    cidr: '10.0.0.0/16',
    data_cidr: '172.23.0.0/20',
    state: 'allocating',
    organization: {
      name: 'my-org',
    },
    generation: 'cedar',
    created_at: '2016-01-06T03:23:13Z',
    updated_at: '2016-01-06T03:23:13Z',
  },
}

export const apps: Record<string, Heroku.App> = {
  www: {
    name: 'acme-inc-www',
    id: 'a84b035c-4c83-11e5-9bda-2cf0ee2c94de',
  },
}

export const topologies: Record<string, SpaceTopology> = {
  'topology-one': {
    version: 1,
    apps: [
      {
        id: apps.www.id,
        domains: ['example.com', 'example.net'],
        formations: [
          {
            process_type: 'web',
            dynos: [
              {
                number: 1,
                private_ip: '10.0.134.42',
                hostname: '1.example-app-90210.app.localspace',
              },
              {
                number: 2,
                private_ip: '10.0.134.42',
                hostname: '1.example-app-90210.app.localspace',
              },
            ],
          },
        ],
      },
    ],
  },
  'topology-two': {
    version: 1,
    apps: [
      {
        id: apps.www.id,
        domains: ['example.com', 'example.net'],
        formations: [
          {
            process_type: 'web',
            dynos: [
              {
                number: 2,
                private_ip: '10.0.134.42',
                hostname: '1.example-app-90210.app.localspace',
              },
              {
                number: 1,
                private_ip: '10.0.134.42',
                hostname: '1.example-app-90210.app.localspace',
              },
            ],
          },
        ],
      },
    ],
  },
  'topology-three': {
    version: 1,
    apps: [
      {
        id: apps.www.id,
        domains: ['example.com', 'example.net'],
        formations: [
          {
            process_type: 'web',
            dynos: [
              {
                number: 1,
                private_ip: '10.0.134.42',
                hostname: '1.example-app-90210.app.localspace',
              },
              {
                number: 1,
                private_ip: '10.0.134.42',
                hostname: '1.example-app-90210.app.localspace',
              },
            ],
          },
        ],
      },
    ],
  },
}
