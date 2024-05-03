'use strict'
/* global beforeEach afterEach context */

const cli = require('@heroku/heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const proxyquire = require('proxyquire')
const uuid = require('uuid')

describe('pg:diagnose', () => {
  let api
  let pg
  let diagnose
  let db
  let dbName
  let app
  let addon
  let plan
  let attachment
  let reportID
  const dbURL = 'postgres://user:password@herokupostgres.com/db'

  const fetcher = () => {
    return {
      attachment: async () => {
        return {
          ...attachment,
          addon,
          app,
        }
      },
    }
  }

  const cmd = proxyquire('../../../commands/diagnose', {
    '../lib/fetcher': fetcher,
  })

  beforeEach(() => {
    plan = {
      name: 'heroku-postgresql:standard-0',
      id: uuid.v4(),
    }
    db = {
      id: uuid.v4(),
      name: dbName || 'DATABASE',
      get plan() {
        return plan
      },
      config_vars: ['DATABASE_ENDPOINT_042EExxx_URL', 'DATABASE_URL', 'HEROKU_POSTGRESQL_SILVER_URL'],
      app: {name: 'myapp'},
    }
    attachment = {
      id: 1,
      get name() {
        return db.name
      },
      get config_vars() {
        return db.config_vars
      },
      namespace: null,
    }
    app = {
      name: 'myapp',
      id: uuid.v4(),
    }
    addon = {
      name: 'postgres-1',
      get id() {
        return db.id
      },
      plan,
      app,
    }
    reportID = uuid.v4()

    api = nock('https://api.heroku.com')
    pg = nock('https://api.data.heroku.com')
    diagnose = nock('https://pgdiagnose.herokai.com')
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
    pg.done()
  })

  describe('when not passing arguments', () => {
    it('generates a report', () => {
      api.get(`/addons/${addon.name}`).reply(200, db)
      api.get(`/apps/${app.name}/config-vars`).reply(200, {
        DATABASE_ENDPOINT_042EExxx_URL: dbURL,
        DATABASE_URL: dbURL,
        HEROKU_POSTGRESQL_SILVER_URL: dbURL,
      })
      pg.get(`/client/v11/databases/${db.id}/metrics`).reply(200, [])
      pg.get(`/client/v11/databases/${db.id}/burst_status`).reply(200, {})
      const report = {
        id: reportID,
        app: app.name,
        database: 'DATABASE_URL',
        created_at: '101',
        checks: [
          {
            name: 'Connection count',
            status: 'red',
            results: [{count: 1}],
          },
          {
            name: 'Load',
            status: 'red',
            results: {load: 100},
          },
        ],
      }
      diagnose
        .post('/reports', {
          url: dbURL,
          plan: 'standard-0',
          app: app.name,
          database: 'DATABASE_URL',
          metrics: [],
        })
        .reply(200, report)
      return cmd.run({app: app.name, args: {}, flags: {}}).then(() =>
        expect(cli.stdout).to.equal(`Report ${reportID} for ${app.name}::${report.database}
available for one month after creation on 101

RED: Connection count
Count
─────
1
RED: Load
Load 100
`),
      )
    })
  })

  describe('when passing arguments', () => {
    context('and this argument is a report ID', () => {
      it('displays an existing report', () => {
        dbName = 'HEROKU_POSTGRESQL_SILVER'

        const report = {
          id: reportID,
          app: app.name,
          database: addon.name,
          created_at: '101',
          checks: [
            {
              name: 'Connection count',
              status: 'red',
              results: [{count: 1}],
            },
            {
              name: 'Load',
              status: 'red',
              results: {load: 100},
            },
          ],
        }
        diagnose.get(`/reports/${reportID}`).reply(200, report)
        return cmd.run({app: app.name, args: {'DATABASE|REPORT_ID': reportID}, flags: {}}).then(() =>
          expect(cli.stdout).to.equal(`Report ${reportID} for ${app.name}::${report.database}
available for one month after creation on 101

RED: Connection count
Count
─────
1
RED: Load
Load 100
`),
        )
        // This is to ensure that each test sets up its own db name when that's their interest.
        // Otherwise, it'll default to `DATABASE`
        // eslint-disable-next-line no-unreachable
        dbName = undefined
      })
    })

    context('and this argument is a HEROKU_POSTGRESQL_SILVER_URL', () => {
      it('generates a report for that DB', () => {
        api.get(`/addons/${addon.name}`).reply(200, db)
        api.get(`/apps/${app.name}/config-vars`).reply(200, {
          DATABASE_ENDPOINT_042EExxx_URL: dbURL,
          DATABASE_URL: dbURL,
          HEROKU_POSTGRESQL_SILVER_URL: dbURL,
        })
        pg.get(`/client/v11/databases/${db.id}/metrics`).reply(200, [])
        pg.get(`/client/v11/databases/${db.id}/burst_status`).reply(200, {})
        const report = {
          id: reportID,
          app: app.name,
          database: 'HEROKU_POSTGRESQL_SILVER_URL',
          created_at: '101',
          checks: [
            {
              name: 'Connection count',
              status: 'red',
              results: [{count: 1}],
            },
            {
              name: 'Load',
              status: 'red',
              results: {load: 100},
            },
          ],
        }
        diagnose
          .post('/reports', {
            url: dbURL,
            plan: 'standard-0',
            app: app.name,
            database: 'HEROKU_POSTGRESQL_SILVER_URL',
            metrics: [],
          })
          .reply(200, report)
        return cmd
          .run({app: 'myapp', args: {'DATABASE|REPORT_ID': 'HEROKU_POSTGRESQL_SILVER_URL'}, flags: {}})
          .then(() =>
            expect(cli.stdout).to.equal(`Report ${reportID} for ${app.name}::${report.database}
available for one month after creation on 101

RED: Connection count
Count
─────
1
RED: Load
Load 100
`),
          )
      })

      context('with the --json flag set', () => {
        it('outputs in styled JSON', () => {
          api.get(`/addons/${addon.name}`).reply(200, db)
          api.get(`/apps/${app.name}/config-vars`).reply(200, {
            DATABASE_URL: dbURL,
          })
          pg.get(`/client/v11/databases/${db.id}/metrics`).reply(200, [])
          pg.get(`/client/v11/databases/${db.id}/burst_status`).reply(200, {})
          const report = {
            id: reportID,
            app: app.name,
            database: 'DATABASE_URL',
            created_at: '101',
            checks: [
              {
                name: 'Connection count',
                status: 'red',
                results: [{count: 1}],
              },
              {
                name: 'Load',
                status: 'red',
                results: {load: 100},
              },
            ],
          }

          diagnose
            .post('/reports', {
              url: dbURL,
              plan: 'standard-0',
              app: app.name,
              database: 'DATABASE_URL',
              metrics: [],
            })
            .reply(200, report)

          return cmd
            .run({
              app: 'myapp',
              args: {'DATABASE|REPORT_ID': 'DATABASE_URL'},
              flags: {json: true},
            })
            .then(() => expect(cli.stdout).to.equal(JSON.stringify(report, null, 2) + '\n'))
        })
      })
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
            results: [],
          },
          {
            name: 'Load',
            status: 'red',
            results: {},
          },
        ],
      })
      return cmd
        .run({app: 'myapp', args: {'DATABASE|REPORT_ID': '697c8bd7-dbba-4f2d-83b6-789c58cc3a9c'}, flags: {}})
        .then(() =>
          expect(cli.stdout).to.equal(`Report 697c8bd7-dbba-4f2d-83b6-789c58cc3a9c for myapp::postgres-1
available for one month after creation on 101

RED: Connection count
RED: Load
`),
        )
    })

    it('roughly conforms with Ruby output', () => {
      diagnose.get('/reports/697c8bd7-dbba-4f2d-83b6-789c58cc3a9c').reply(200, {
        id: 'abc123',
        app: 'appname',
        created_at: '2014-06-24 01:26:11.941197+00',
        database: 'dbcolor',
        checks: [
          {name: 'Hit Rate', status: 'green', results: null},
          {name: 'Connection Count', status: 'red', results: [{count: 150}]},
          {
            name: 'list',
            status: 'yellow',
            results: [{thing: 'one'}, {thing: 'two'}],
          },
          {
            name: 'Load',
            status: 'skipped',
            results: {
              error: 'Load check not supported on this plan',
            },
          },
        ],
      })
      return cmd
        .run({app: 'myapp', args: {'DATABASE|REPORT_ID': '697c8bd7-dbba-4f2d-83b6-789c58cc3a9c'}, flags: {}})
        .then(() =>
          expect(cli.stdout).to.equal(`Report abc123 for appname::dbcolor
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
`),
        )
    })

    it('converts underscores to spaces', () => {
      diagnose.get('/reports/697c8bd7-dbba-4f2d-83b6-789c58cc3a9c').reply(200, {
        id: 'abc123',
        app: 'appname',
        created_at: '2014-06-24 01:26:11.941197+00',
        database: 'dbcolor',
        checks: [
          {
            name: 'Load',
            status: 'skipped',
            results: {
              error_thing: 'Load check not supported on this plan',
            },
          },
        ],
      })
      return cmd
        .run({app: 'myapp', args: {'DATABASE|REPORT_ID': '697c8bd7-dbba-4f2d-83b6-789c58cc3a9c'}, flags: {}})
        .then(() =>
          expect(cli.stdout).to.equal(`Report abc123 for appname::dbcolor
available for one month after creation on 2014-06-24 01:26:11.941197+00

SKIPPED: Load
Error Thing Load check not supported on this plan
`),
        )
    })
  })
})
