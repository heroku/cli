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
        }
      ]
    })
    return cmd.run({app: 'myapp', args: {}})
    .then(() => expect(cli.stdout, 'to equal', `Report 697c8bd7-dbba-4f2d-83b6-789c58cc3a9c for myapp::postgres-1
available for one month after creation on 101

RED: Connection count
count
─────
1
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
        }
      ]
    })
    return cmd.run({app: 'myapp', args: {'DATABASE|REPORT_ID': '697c8bd7-dbba-4f2d-83b6-789c58cc3a9c'}})
    .then(() => expect(cli.stdout, 'to equal', `Report 697c8bd7-dbba-4f2d-83b6-789c58cc3a9c for myapp::postgres-1
available for one month after creation on 101

RED: Connection count
count
─────
1
`))
  })
})
