/* eslint-disable quote-props */
'use strict'

let fixtures = {}
module.exports = fixtures

fixtures.apps = {
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

fixtures.services = {
  'heroku-postgresql': {
    'created_at': '2013-10-24T17:21:05Z',
    'default': true,
    'description': 'Heroku Postgres Hobby Dev',
    'human_name': 'Hobby Dev',
    'id': '062a1cc7-f79f-404c-9f91-135f70175577',
    'name': 'heroku-postgresql',
    'price': {
      'cents': 0,
      'unit': 'month',
    },
    'state': 'ga',
    'updated_at': '2014-06-18T17:06:29Z',
  },

  'heroku-redis': {
    'cli_plugin_name': 'heroku-redis',
    'created_at': '2014-09-30T21:45:10Z',
    'human_name': 'Heroku Redis',
    'id': '5bbf672c-07f6-49c2-9c16-f1dcb96784db',
    'name': 'heroku-redis',
    'state': 'ga',
    'supports_multiple_installations': true,
    'supports_sharing': true,
    'updated_at': '2015-08-27T06:42:14Z',
  },
}

fixtures.plans = {
  'heroku-postgresql:mini': {
    'created_at': '2013-10-24T17:21:05Z',
    'default': true,
    'description': 'Heroku Postgres Mini',
    'human_name': 'Mini',
    'id': '062a1cc7-f79f-404c-9f91-135f70175577',
    'name': 'heroku-postgresql:mini',
    'price': {
      'cents': 500,
      'unit': 'month',
    },
    'state': 'ga',
    'updated_at': '2014-06-18T17:06:29Z',
  },
  'heroku-postgresql:standard-2': {
    'created_at': '2014-08-07T21:37:41Z',
    'default': false,
    'description': 'Heroku Postgres Standard 2',
    'human_name': 'Standard 2',
    'id': '4ffe09a7-369d-452e-bdfc-db35073e971a',
    'name': 'heroku-postgresql:standard-2',
    'price': {
      'cents': 20000,
      'unit': 'month',
    },
    'state': 'ga',
    'updated_at': '2014-09-04T14:03:26Z',
  },
  'heroku-redis:premium-2': {
    'created_at': '2015-06-23T19:03:06Z',
    'default': false,
    'description': 'Heroku Redis Premium 2',
    'human_name': 'Premium 2',
    'id': 'b20bdaae-137f-4c39-9b51-e7b19b0ab5ff',
    'name': 'heroku-redis:premium-2',
    'price': {
      'cents': 6000,
      'unit': 'month',
    },
    'state': 'ga',
    'updated_at': '2015-06-25T16:10:02Z',
  },
}

fixtures.addons = {
  'www-db': {
    app: fixtures.apps.www,
    id: '8895ea98-4c7b-11e5-9a16-2cf0ee2c94de',
    name: 'www-db',
    addon_service: fixtures.services['heroku-postgresql'],
    plan: fixtures.plans['heroku-postgresql:mini'],
    state: 'provisioned',
    billed_price: {
      cents: 500,
    },
  },
  'www-db-2': {
    app: fixtures.apps.api,
    id: 'b68d8f51-6577-4a46-a617-c5f36f1bb032',
    name: 'www-db-2',
    addon_service: fixtures.services['heroku-postgresql'],
    plan: fixtures.plans['heroku-postgresql:mini'],
    state: 'deprovisioned',
    billed_price: {
      cents: 500,
    },
  },
  'www-redis': {
    app: fixtures.apps.www,
    id: '8a836ecc-4c88-11e5-ba7e-2cf0ee2c94de',
    name: 'www-redis',
    addon_service: fixtures.services['heroku-redis'],
    plan: fixtures.plans['heroku-redis:premium-2'],
    state: 'provisioning',
    billed_price: {
      cents: 6000,
    },
  },
  'www-redis-2': {
    app: fixtures.apps.www,
    id: 'bc28b002-44da-4b8b-9dba-f0ef236a5759',
    name: 'www-redis-2',
    addon_service: fixtures.services['heroku-redis'],
    plan: fixtures.plans['heroku-redis:premium-2'],
    state: 'deprovisioning',
    billed_price: {
      cents: 6000,
    },
  },
  'api-redis': {
    app: fixtures.apps.api,
    id: 'fd1d2d74-4c88-11e5-8b63-2cf0ee2c94de',
    name: 'api-redis',
    addon_service: fixtures.services['heroku-redis'],
    plan: fixtures.plans['heroku-redis:premium-2'],
    state: 'provisioned',
    billed_price: {
      cents: 6000,
    },
  },
  'dwh-test-db': {
    app: fixtures.apps.dwh,
    id: '87f63372-60f8-11e5-bd19-2cf0ee2c94de',
    name: 'dwh-test-db',
    addon_service: fixtures.services['heroku-postgresql'],
    plan: fixtures.plans['heroku-postgresql:mini'],
    state: 'provisioned',
    billed_price: {
      cents: 500,
    },
  },
  'dwh-db': {
    app: fixtures.apps.dwh,
    id: 'e00e794c-60ef-11e5-a8c7-2cf0ee2c94de',
    name: 'dwh-db',
    addon_service: fixtures.services['heroku-postgresql'],
    plan: fixtures.plans['heroku-postgresql:standard-2'],
    state: 'provisioned',
    billed_price: {
      cents: 20000,
    },
  },
  'dwh-db-2': {
    app: fixtures.apps.dwh,
    id: '10b42dda-60fa-11e5-8567-2cf0ee2c94de',
    name: 'dwh-db-2',
    addon_service: fixtures.services['heroku-postgresql'],
    plan: fixtures.plans['heroku-postgresql:standard-2'],
    state: 'provisioned',
    billed_price: {
      cents: 20000,
    },
  },
}

fixtures.attachments = {
  'acme-inc-api::QUEUE': {
    id: '59790f12-60f1-11e5-8b28-2cf0ee2c94de',
    name: 'QUEUE',
    app: fixtures.apps.api,
    addon: {
      id: fixtures.addons['api-redis'].id,
      name: fixtures.addons['api-redis'].name,
      app: fixtures.addons['api-redis'].app,
    },
  },
  'acme-inc-api::WWW_DB': {
    id: '3e8bd32e-60fb-11e5-8f58-2cf0ee2c94de',
    name: 'WWW_DB',
    app: fixtures.apps.api,
    addon: {
      id: fixtures.addons['www-db'].id,
      name: fixtures.addons['www-db'].name,
      app: fixtures.addons['www-db'].app,
    },
  },
  'acme-inc-dwh::WWW_DB': {
    id: 'e97f68d6-60f6-11e5-82ba-2cf0ee2c94de',
    name: 'WWW_DB',
    app: fixtures.apps.dwh,
    addon: {
      id: fixtures.addons['www-db'].id,
      name: fixtures.addons['www-db'].name,
      app: fixtures.addons['www-db'].app,
    },
  },
  'acme-inc-dwh::API_QUEUE': {
    id: '5cf8e4be-60f1-11e5-b208-2cf0ee2c94de',
    name: 'API_QUEUE',
    app: fixtures.apps.dwh,
    addon: {
      id: fixtures.addons['api-redis'].id,
      name: fixtures.addons['api-redis'].name,
      app: fixtures.addons['api-redis'].app,
    },
  },
  'acme-inc-dwh::DATABASE': {
    id: '483d95e2-60f1-11e5-8c3b-2cf0ee2c94de',
    name: 'DATABASE',
    app: fixtures.apps.dwh,
    addon: {
      id: fixtures.addons['dwh-db'].id,
      name: fixtures.addons['dwh-db'].name,
      app: fixtures.addons['dwh-db'].app,
    },
  },
  'acme-inc-dwh::DATABASE_FOLLOWER': {
    id: '3da438d0-60fa-11e5-9194-2cf0ee2c94de',
    name: 'DATABASE_FOLLOWER',
    app: fixtures.apps.dwh,
    addon: {
      id: fixtures.addons['dwh-db-2'].id,
      name: fixtures.addons['dwh-db-2'].name,
      app: fixtures.addons['dwh-db-2'].app,
    },
  },
  'acme-inc-dwh::TEST': {
    id: '483d95e2-60f1-11e5-8c3b-2cf0ee2c94de',
    name: 'TEST',
    app: fixtures.apps.dwh,
    addon: {
      id: fixtures.addons['dwh-test-db'].id,
      name: fixtures.addons['dwh-test-db'].name,
      app: fixtures.addons['dwh-test-db'].app,
    },
  },
  'acme-inc-dwh::WWW_CACHE': {
    id: '233bc200-60f1-11e5-9da0-2cf0ee2c94de',
    name: 'WWW_CACHE',
    app: fixtures.apps.dwh,
    addon: {
      id: fixtures.addons['www-redis'].id,
      name: fixtures.addons['www-redis'].name,
      app: fixtures.addons['www-redis'].app,
    },
  },
  'acme-inc-www::DATABASE': {
    id: '9e2f1620-60eb-11e5-b93e-2cf0ee2c94de',
    name: 'DATABASE',
    app: fixtures.apps.www,
    addon: {
      id: fixtures.addons['www-db'].id,
      name: fixtures.addons['www-db'].name,
      app: fixtures.addons['www-db'].app,
    },
  },
  'acme-inc-www::HEROKU_POSTGRESQL_RED': {
    id: '4b04417c-60f1-11e5-9312-2cf0ee2c94de',
    name: 'HEROKU_POSTGRESQL_RED',
    app: fixtures.apps.www,
    addon: {
      id: fixtures.addons['www-db'].id,
      name: fixtures.addons['www-db'].name,
      app: fixtures.addons['www-db'].app,
    },
  },
  'acme-inc-www::REDIS': {
    id: '221ce0c0-60ec-11e5-bd02-2cf0ee2c94de',
    name: 'REDIS',
    app: fixtures.apps.www,
    addon: {
      id: fixtures.addons['www-redis'].id,
      name: fixtures.addons['www-redis'].name,
      app: fixtures.addons['www-redis'].app,
    },
  },
}
