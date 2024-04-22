import * as Heroku from '@heroku-cli/schema'

export const spaces: Record<string, Required<Heroku.Space>> = {
  'non-shield-space': {
    id: '1234',
    name: 'my-unshielded-space',
    shield: false,
    region: {
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
    created_at: '2016-01-06T03:23:13Z',
    updated_at: '2016-01-06T03:23:13Z',
  },
  'shield-space': {
    id: '1234',
    name: 'my-shielded-space',
    shield: true,
    region: {
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
    created_at: '2016-01-06T03:23:13Z',
    updated_at: '2016-01-06T03:23:13Z',
  },
}
