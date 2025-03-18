import * as Heroku from '@heroku-cli/schema'

export const apps: Record<string, Heroku.App> = {
  api: {
    name: 'acme-inc-api',
    id: 'e69612aa-4c88-11e5-887e-2cf0ee2c94de',
  },
  dwh: {
    name: 'acme-inc-dwh',
    id: '68878cbc-60ed-11e5-aa97-2cf0ee2c94de',
  },
  www: {
    name: 'acme-inc-www',
    id: 'a84b035c-4c83-11e5-9bda-2cf0ee2c94de',
  },
}

export const services: Record<string, Heroku.AddOnService> = {
  'heroku-postgresql': {
    created_at: '2013-10-24T17:21:05Z',
    default: true,
    description: 'Heroku Postgres Hobby Dev',
    human_name: 'Hobby Dev',
    id: '062a1cc7-f79f-404c-9f91-135f70175577',
    name: 'heroku-postgresql',
    price: {
      cents: 0,
      unit: 'month',
    },
    state: 'ga',
    updated_at: '2014-06-18T17:06:29Z',
  },

  'heroku-redis': {
    cli_plugin_name: 'heroku-redis',
    created_at: '2014-09-30T21:45:10Z',
    human_name: 'Heroku Redis',
    id: '5bbf672c-07f6-49c2-9c16-f1dcb96784db',
    name: 'heroku-redis',
    state: 'ga',
    supports_multiple_installations: true,
    supports_sharing: true,
    updated_at: '2015-08-27T06:42:14Z',
  },
}

export const plans: Record<string, Heroku.Plan> = {
  'heroku-postgresql:mini': {
    created_at: '2013-10-24T17:21:05Z',
    default: true,
    description: 'Heroku Postgres Mini',
    human_name: 'Mini',
    id: '062a1cc7-f79f-404c-9f91-135f70175577',
    name: 'heroku-postgresql:mini',
    price: {
      cents: 500,
      unit: 'month',
    },
    state: 'ga',
    updated_at: '2014-06-18T17:06:29Z',
  },
  'heroku-postgresql:standard-2': {
    created_at: '2014-08-07T21:37:41Z',
    default: false,
    description: 'Heroku Postgres Standard 2',
    human_name: 'Standard 2',
    id: '4ffe09a7-369d-452e-bdfc-db35073e971a',
    name: 'heroku-postgresql:standard-2',
    price: {
      cents: 20000,
      unit: 'month',
    },
    state: 'ga',
    updated_at: '2014-09-04T14:03:26Z',
  },
  'heroku-postgresql:premium-3': {
    created_at: '2014-08-07T21:37:41Z',
    default: false,
    description: 'Heroku Postgres Premium 3',
    human_name: 'Premium 3',
    id: 'aaaaaaaa-369d-452e-bdfc-db35073e971a',
    name: 'heroku-postgresql:premium-3',
    price: {
      cents: 75000,
      unit: 'month',
    },
    state: 'ga',
    updated_at: '2014-09-04T14:03:26Z',
  },
  'heroku-postgresql:private-4': {
    created_at: '2014-08-07T21:37:41Z',
    default: false,
    description: 'Heroku Postgres Private 4',
    human_name: 'Private 4',
    id: 'bbbbbbbb-369d-452e-bdfc-db35073e971a',
    name: 'heroku-postgresql:private-4',
    price: {
      cents: 150000,
      unit: 'month',
    },
    state: 'ga',
    updated_at: '2014-09-04T14:03:26Z',
  },
  'heroku-redis:premium-2': {
    created_at: '2015-06-23T19:03:06Z',
    default: false,
    description: 'Heroku Redis Premium 2',
    human_name: 'Premium 2',
    id: 'b20bdaae-137f-4c39-9b51-e7b19b0ab5ff',
    name: 'heroku-redis:premium-2',
    price: {
      cents: 6000,
      unit: 'month',
    },
    state: 'ga',
    updated_at: '2015-06-25T16:10:02Z',
  },
  'heroku-inference:plan-1': {
    created_at: '2024-06-23T19:03:06Z',
    default: true,
    description: 'Heroku Inference Plan 1',
    human_name: 'Plan 1',
    id: 'b20bdaae-137f-4c39-9b51-e7b19b0ab5ff',
    name: 'heroku-inference:plan-1',
    price: {
      cents: 0,
      unit: 'month',
      metered: true,
    },
    state: 'ga',
    updated_at: '2024-06-25T16:10:02Z',
  },
  'heroku-inference:plan-2': {
    created_at: '2024-06-23T19:03:06Z',
    default: false,
    description: 'Heroku Inference Plan 2',
    human_name: 'Plan 2',
    id: 'b20bdaae-137f-4c39-9b51-e7b19b0ab5gg',
    name: 'heroku-inference:plan-2',
    price: {
      cents: 0,
      unit: 'month',
      metered: true,
    },
    state: 'ga',
    updated_at: '2024-06-25T16:10:02Z',
  },
  'heroku-inference:plan-3': {
    created_at: '2024-06-23T19:03:06Z',
    default: false,
    description: 'Heroku Inference Plan 3',
    human_name: 'Plan 3',
    id: 'b20bdaae-137f-4c39-9b51-e7b19b0ab5hh',
    name: 'heroku-inference:plan-3',
    price: {
      cents: 0,
      unit: 'month',
      metered: true,
    },
    state: 'ga',
    updated_at: '2024-06-25T16:10:02Z',
  },
}

export const addons: Record<string, Heroku.AddOn> = {
  'www-db': {
    app: apps.www,
    id: '8895ea98-4c7b-11e5-9a16-2cf0ee2c94de',
    name: 'www-db',
    addon_service: services['heroku-postgresql'],
    plan: plans['heroku-postgresql:mini'],
    state: 'provisioned',
    billed_price: {
      cents: 500,
    },
  },
  'www-db-2': {
    app: apps.api,
    id: 'b68d8f51-6577-4a46-a617-c5f36f1bb032',
    name: 'www-db-2',
    addon_service: services['heroku-postgresql'],
    plan: plans['heroku-postgresql:mini'],
    state: 'deprovisioned',
    billed_price: {
      cents: 500,
    },
  },
  'www-redis': {
    app: apps.www,
    id: '8a836ecc-4c88-11e5-ba7e-2cf0ee2c94de',
    name: 'www-redis',
    addon_service: services['heroku-redis'],
    plan: plans['heroku-redis:premium-2'],
    state: 'provisioning',
    billed_price: {
      cents: 6000,
    },
  },
  'www-redis-2': {
    app: apps.www,
    id: 'bc28b002-44da-4b8b-9dba-f0ef236a5759',
    name: 'www-redis-2',
    addon_service: services['heroku-redis'],
    plan: plans['heroku-redis:premium-2'],
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    state: 'deprovisioning',
    billed_price: {
      cents: 6000,
    },
  },
  'api-redis': {
    app: apps.api,
    id: 'fd1d2d74-4c88-11e5-8b63-2cf0ee2c94de',
    name: 'api-redis',
    addon_service: services['heroku-redis'],
    plan: plans['heroku-redis:premium-2'],
    state: 'provisioned',
    billed_price: {
      cents: 6000,
    },
  },
  'dwh-test-db': {
    app: apps.dwh,
    id: '87f63372-60f8-11e5-bd19-2cf0ee2c94de',
    name: 'dwh-test-db',
    addon_service: services['heroku-postgresql'],
    plan: plans['heroku-postgresql:mini'],
    state: 'provisioned',
    billed_price: {
      cents: 500,
    },
  },
  'dwh-db': {
    app: apps.dwh,
    id: 'e00e794c-60ef-11e5-a8c7-2cf0ee2c94de',
    name: 'dwh-db',
    addon_service: services['heroku-postgresql'],
    plan: plans['heroku-postgresql:standard-2'],
    state: 'provisioned',
    billed_price: {
      cents: 20000,
    },
  },
  'dwh-db-2': {
    app: apps.dwh,
    id: '10b42dda-60fa-11e5-8567-2cf0ee2c94de',
    name: 'dwh-db-2',
    addon_service: services['heroku-postgresql'],
    plan: plans['heroku-postgresql:standard-2'],
    state: 'provisioned',
    billed_price: {
      cents: 20000,
    },
  },
}

export const attachments: Record<string, Heroku.AddOnAttachment> = {
  'acme-inc-api::QUEUE': {
    id: '59790f12-60f1-11e5-8b28-2cf0ee2c94de',
    name: 'QUEUE',
    app: apps.api,
    addon: {
      id: addons['api-redis'].id as string,
      name: addons['api-redis'].name as string,
      app: addons['api-redis'].app as Heroku.App,
    },
  },
  'acme-inc-api::WWW_DB': {
    id: '3e8bd32e-60fb-11e5-8f58-2cf0ee2c94de',
    name: 'WWW_DB',
    app: apps.api,
    addon: {
      id: addons['www-db'].id as string,
      name: addons['www-db'].name as string,
      app: addons['www-db'].app as Heroku.App,
    },
  },
  'acme-inc-dwh::WWW_DB': {
    id: 'e97f68d6-60f6-11e5-82ba-2cf0ee2c94de',
    name: 'WWW_DB',
    app: apps.dwh,
    addon: {
      id: addons['www-db'].id as string,
      name: addons['www-db'].name as string,
      app: addons['www-db'].app as Heroku.App,
    },
  },
  'acme-inc-dwh::API_QUEUE': {
    id: '5cf8e4be-60f1-11e5-b208-2cf0ee2c94de',
    name: 'API_QUEUE',
    app: apps.dwh,
    addon: {
      id: addons['api-redis'].id as string,
      name: addons['api-redis'].name as string,
      app: addons['api-redis'].app as Heroku.App,
    },
  },
  'acme-inc-dwh::DATABASE': {
    id: '483d95e2-60f1-11e5-8c3b-2cf0ee2c94de',
    name: 'DATABASE',
    app: apps.dwh,
    addon: {
      id: addons['dwh-db'].id as string,
      name: addons['dwh-db'].name as string,
      app: addons['dwh-db'].app as Heroku.App,
    },
  },
  'acme-inc-dwh::DATABASE_FOLLOWER': {
    id: '3da438d0-60fa-11e5-9194-2cf0ee2c94de',
    name: 'DATABASE_FOLLOWER',
    app: apps.dwh,
    addon: {
      id: addons['dwh-db-2'].id as string,
      name: addons['dwh-db-2'].name as string,
      app: addons['dwh-db-2'].app as Heroku.App,
    },
  },
  'acme-inc-dwh::TEST': {
    id: '483d95e2-60f1-11e5-8c3b-2cf0ee2c94de',
    name: 'TEST',
    app: apps.dwh,
    addon: {
      id: addons['dwh-test-db'].id as string,
      name: addons['dwh-test-db'].name as string,
      app: addons['dwh-test-db'].app as Heroku.App,
    },
  },
  'acme-inc-dwh::WWW_CACHE': {
    id: '233bc200-60f1-11e5-9da0-2cf0ee2c94de',
    name: 'WWW_CACHE',
    app: apps.dwh,
    addon: {
      id: addons['www-redis'].id as string,
      name: addons['www-redis'].name as string,
      app: addons['www-redis'].app as Heroku.App,
    },
  },
  'acme-inc-www::DATABASE': {
    id: '9e2f1620-60eb-11e5-b93e-2cf0ee2c94de',
    name: 'DATABASE',
    app: apps.www,
    addon: {
      id: addons['www-db'].id as string,
      name: addons['www-db'].name as string,
      app: addons['www-db'].app as Heroku.App,
    },
  },
  'acme-inc-www::HEROKU_POSTGRESQL_RED': {
    id: '4b04417c-60f1-11e5-9312-2cf0ee2c94de',
    name: 'HEROKU_POSTGRESQL_RED',
    app: apps.www,
    addon: {
      id: addons['www-db'].id as string,
      name: addons['www-db'].name as string,
      app: addons['www-db'].app as Heroku.App,
    },
  },
  'acme-inc-www::REDIS': {
    id: '221ce0c0-60ec-11e5-bd02-2cf0ee2c94de',
    name: 'REDIS',
    app: apps.www,
    addon: {
      id: addons['www-redis'].id as string,
      name: addons['www-redis'].name as string,
      app: addons['www-redis'].app as Heroku.App,
    },
  },
}
