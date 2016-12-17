'use strict'
/* global describe it beforeEach afterEach */

const cli = require('heroku-cli-util')
const expect = require('unexpected')
const nock = require('nock')
const proxyquire = require('proxyquire')

const db = {
  name: 'postgres-1',
  plan: {name: 'heroku-postgresql:standard-0'},
  config_vars: ['DATABASE_URL'],
  app: {name: 'myapp'}
}

const fetcher = () => {
  return {
    addon: () => db
  }
}

const cmd = proxyquire('../../commands/diagnose', {
  '../lib/fetcher': fetcher
})

describe('pg:diagnose', () => {
  let api, pg, diagnose

  beforeEach(() => {
    api = nock('https://api.heroku.com')
    pg = nock('https://postgres-api.heroku.com')
    diagnose = nock('https://pgdiagnose.herokai.com')
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
    pg.done()
  })

  it('generates a report', () => {
    api.get('/addons/postgres-1').reply(200, db)
    api.get('/apps/myapp/config-vars').reply(200, {DATABASE_URL: 'postgres://db'})
    pg.get('/client/v11/databases/postgres-1/metrics').reply(200, [])
    diagnose.post('/reports', {
      url: 'postgres://db',
      plan: 'standard-0',
      app: 'myapp',
      database: 'DATABASE_URL',
      metrics: []
    }).reply(200, {
      id: '697c8bd7-dbba-4f2d-83b6-789c58cc3a9c',
      app: 'myapp',
      database: 'postgres-1',
      created_at: '101',
      checks: [
        {
          name: 'Connection count',
          status: 'red',
          results: [{count: 1}]
        },
        {
          name: 'Load',
          status: 'red',
          results: {load: 100}
        }
      ]
    })
    return cmd.run({app: 'myapp', args: {}})
    .then(() => expect(cli.stdout, 'to equal', `Report 697c8bd7-dbba-4f2d-83b6-789c58cc3a9c for myapp::postgres-1
available for one month after creation on 101

RED: Connection count
Count
─────
1
RED: Load
Load 100
`))
  })

  it('displays an existing report', () => {
    diagnose.get('/reports/697c8bd7-dbba-4f2d-83b6-789c58cc3a9c').reply(200, {
      id: '697c8bd7-dbba-4f2d-83b6-789c58cc3a9c',
      app: 'myapp',
      database: 'postgres-1',
      created_at: '101',
      checks: [
        {
          name: 'Connection count',
          status: 'red',
          results: [{count: 1}]
        },
        {
          name: 'Load',
          status: 'red',
          results: {load: 100}
        }
      ]
    })
    return cmd.run({app: 'myapp', args: {'DATABASE|REPORT_ID': '697c8bd7-dbba-4f2d-83b6-789c58cc3a9c'}})
    .then(() => expect(cli.stdout, 'to equal', `Report 697c8bd7-dbba-4f2d-83b6-789c58cc3a9c for myapp::postgres-1
available for one month after creation on 101

RED: Connection count
Count
─────
1
RED: Load
Load 100
`))
  })

  it('displays an existing report with empty results', () => {
    diagnose.get('/reports/697c8bd7-dbba-4f2d-83b6-789c58cc3a9c').reply(200, {
      id: '697c8bd7-dbba-4f2d-83b6-789c58cc3a9c',
      app: 'myapp',
      database: 'postgres-1',
      created_at: '101',
      checks: [
        {
          name: 'Connection count',
          status: 'red',
          results: []
        },
        {
          name: 'Load',
          status: 'red',
          results: {}
        }
      ]
    })
    return cmd.run({app: 'myapp', args: {'DATABASE|REPORT_ID': '697c8bd7-dbba-4f2d-83b6-789c58cc3a9c'}})
    .then(() => expect(cli.stdout, 'to equal', `Report 697c8bd7-dbba-4f2d-83b6-789c58cc3a9c for myapp::postgres-1
available for one month after creation on 101

RED: Connection count
RED: Load
`))
  })

  it('roughly conforms with Ruby output', () => {
    diagnose.get('/reports/697c8bd7-dbba-4f2d-83b6-789c58cc3a9c').reply(200, {
      'id': 'abc123',
      'app': 'appname',
      'created_at': '2014-06-24 01:26:11.941197+00',
      'database': 'dbcolor',
      'checks': [
        {'name': 'Hit Rate', 'status': 'green', 'results': null},
        {'name': 'Connection Count', 'status': 'red', 'results': [{'count': 150}]},
        {
          'name': 'list',
          'status': 'yellow',
          'results': [
            {'thing': 'one'},
            {'thing': 'two'}
          ]
        },
        {
          'name': 'Load',
          'status': 'skipped',
          'results': {
            'error': 'Load check not supported on this plan'
          }
        }
      ]
    })
    return cmd.run({app: 'myapp', args: {'DATABASE|REPORT_ID': '697c8bd7-dbba-4f2d-83b6-789c58cc3a9c'}})
    .then(() => expect(cli.stdout, 'to equal', `Report abc123 for appname::dbcolor
available for one month after creation on 2014-06-24 01:26:11.941197+00

RED: Connection Count
Count
─────
150
YELLOW: list
Thing
─────
one
two
GREEN: Hit Rate
SKIPPED: Load
Error Load check not supported on this plan
`))
  })

  it('converts underscores to spaces', () => {
    diagnose.get('/reports/697c8bd7-dbba-4f2d-83b6-789c58cc3a9c').reply(200, {
      'id': 'abc123',
      'app': 'appname',
      'created_at': '2014-06-24 01:26:11.941197+00',
      'database': 'dbcolor',
      'checks': [
        {
          'name': 'Load',
          'status': 'skipped',
          'results': {
            'error_thing': 'Load check not supported on this plan'
          }
        }
      ]
    })
    return cmd.run({app: 'myapp', args: {'DATABASE|REPORT_ID': '697c8bd7-dbba-4f2d-83b6-789c58cc3a9c'}})
    .then(() => expect(cli.stdout, 'to equal', `Report abc123 for appname::dbcolor
available for one month after creation on 2014-06-24 01:26:11.941197+00

SKIPPED: Load
Error Thing Load check not supported on this plan
`))
  })
})
