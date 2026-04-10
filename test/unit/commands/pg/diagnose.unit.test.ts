import type {AddOn, AddOnAttachment} from '@heroku-cli/schema'
import type {pg} from '@heroku/heroku-cli-util'

import {expect} from 'chai'
import nock from 'nock'
import {randomUUID} from 'node:crypto'
import {stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/pg/diagnose.js'
import runCommand from '../../../helpers/runCommand.js'
import normalizeTableOutput from '../../../helpers/utils/normalize-table-output.js'

const heredoc = tsheredoc.default

describe('pg:diagnose', function () {
  let api: nock.Scope
  let pg: nock.Scope
  let diagnose: nock.Scope
  let db: Pick<pg.ExtendedAddonAttachment, 'app' | 'config_vars' | 'id' | 'name' | 'plan'>
  let dbName: string | undefined
  let app: {id?: string; name: string;}
  let addon: AddOn
  let plan: {id: string; name: string;}
  let attachment: AddOnAttachment
  let reportID: string
  const dbURL = 'postgres://user:password@herokupostgres.com/db'

  beforeEach(function () {
    plan = {
      id: randomUUID(), name: 'heroku-postgresql:standard-0',
    }
    db = {
      app: {id: randomUUID(), name: 'myapp'},
      config_vars: ['DATABASE_ENDPOINT_042EExxx_URL', 'DATABASE_URL', 'HEROKU_POSTGRESQL_SILVER_URL'],
      id: randomUUID(),
      name: dbName || 'DATABASE',
      get plan() {
        return plan
      },
    }
    attachment = {
      get config_vars() {
        return db.config_vars
      }, id: '1', get name() {
        return db.name
      }, namespace: null,
    }
    app = {
      id: randomUUID(), name: 'myapp',
    }
    addon = {
      app, get id() {
        return db.id
      }, name: 'postgres-1', plan,
    }
    reportID = randomUUID()
    api = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve').reply(200, [{...attachment, addon}])
      .get(`/addons/${addon.name}`).reply(200, db)
    pg = nock('https://api.data.heroku.com')
    diagnose = nock('https://pgdiagnose.herokai.com:443')
  })

  afterEach(function () {
    nock.cleanAll()
    api.done()
    pg.done()
    diagnose.done()
  })

  describe('when not passing arguments', function () {
    it('generates a report', async function () {
      api.get(`/apps/${app.name}/config-vars`).reply(200, {
        DATABASE_ENDPOINT_042EExxx_URL: dbURL, DATABASE_URL: dbURL, HEROKU_POSTGRESQL_SILVER_URL: dbURL,
      })

      pg.get(`/client/v11/databases/${db.id}/metrics`).reply(200, [])
        .get(`/client/v11/databases/${db.id}/burst_status`).reply(200, {})

      const report = {
        app: app.name, checks: [
          {
            name: 'Connection count', results: [{count: 1}], status: 'red',
          }, {
            name: 'Load', results: {load: 100}, status: 'red',
          },
        ], created_at: '101', database: 'DATABASE_URL', id: reportID,
      }
      diagnose.post('/reports', {
        app: app.name, database: 'DATABASE_URL', metrics: [], plan: 'standard-0', url: dbURL,
      }).reply(200, report)

      await runCommand(Cmd, [
        '--app',
        app.name,
      ])
      expect(normalizeTableOutput(stdout.output)).to.eq(normalizeTableOutput(heredoc(`
      Report ${reportID} for ${app.name}::${report.database}
      available for one month after creation on 101

      RED: Connection count
       Count
       ─────
       1
      RED: Load
      Load 100
      `)))
    })
  })

  describe('when passing arguments', function () {
    context('and this argument is a report ID', function () {
      it('displays an existing report', async function () {
        dbName = 'HEROKU_POSTGRESQL_SILVER'
        const report = {
          app: app.name, checks: [
            {
              name: 'Connection count', results: [{count: 1}], status: 'red',
            }, {
              name: 'Load', results: {load: 100}, status: 'red',
            },
          ], created_at: '101', database: addon.name, id: reportID,
        }
        diagnose.get(`/reports/${reportID}`).reply(200, report)
        await runCommand(Cmd, [
          '--app',
          app.name,
          reportID,
        ])
        expect(normalizeTableOutput(stdout.output)).to.eq(normalizeTableOutput(heredoc(`
        Report ${reportID} for ${app.name}::${report.database}
        available for one month after creation on 101

        RED: Connection count
         Count
         ─────
         1
        RED: Load
        Load 100
        `)))
      })
    })
    context('and this argument is a HEROKU_POSTGRESQL_SILVER_URL', function () {
      it('generates a report for that DB', async function () {
        api.get(`/addons/${addon.name}`)
          .reply(200, db)
        api.get(`/apps/${app.name}/config-vars`)
          .reply(200, {
            DATABASE_ENDPOINT_042EExxx_URL: dbURL, DATABASE_URL: dbURL, HEROKU_POSTGRESQL_SILVER_URL: dbURL,
          })
        pg.get(`/client/v11/databases/${db.id}/metrics`)
          .reply(200, [])
        pg.get(`/client/v11/databases/${db.id}/burst_status`)
          .reply(200, {})
        const report = {
          app: app.name, checks: [
            {
              name: 'Connection count', results: [{count: 1}], status: 'red',
            }, {
              name: 'Load', results: {load: 100}, status: 'red',
            },
          ], created_at: '101', database: 'HEROKU_POSTGRESQL_SILVER_URL', id: reportID,
        }
        diagnose.post('/reports', {
          app: app.name, database: 'HEROKU_POSTGRESQL_SILVER_URL', metrics: [], plan: 'standard-0', url: dbURL,
        })
          .reply(200, report)
        await runCommand(Cmd, [
          '--app',
          'myapp',
        ])
        expect(normalizeTableOutput(stdout.output)).to.eq(normalizeTableOutput(heredoc(`
        Report ${reportID} for ${app.name}::${report.database}
        available for one month after creation on 101

        RED: Connection count
         Count
         ─────
         1
        RED: Load
        Load 100
        `)))
      })

      context('with the --json flag set', function () {
        it('outputs in styled JSON', async function () {
          api.get(`/addons/${addon.name}`)
            .reply(200, db)
          api.get(`/apps/${app.name}/config-vars`)
            .reply(200, {
              DATABASE_URL: dbURL,
            })
          pg.get(`/client/v11/databases/${db.id}/metrics`)
            .reply(200, [])
          pg.get(`/client/v11/databases/${db.id}/burst_status`)
            .reply(200, {})
          const report = {
            app: app.name, checks: [
              {
                name: 'Connection count', results: [{count: 1}], status: 'red',
              }, {
                name: 'Load', results: {load: 100}, status: 'red',
              },
            ], created_at: '101', database: 'DATABASE_URL', id: reportID,
          }
          diagnose.post('/reports', {
            app: app.name, database: 'DATABASE_URL', metrics: [], plan: 'standard-0', url: dbURL,
          })
            .reply(200, report)
          await runCommand(Cmd, [
            '--app',
            'myapp',
            '--json',
          ])
          expect(stdout.output).to.equal(JSON.stringify(report, null, 2) + '\n')
        })
      })
    })

    it('displays an existing report with empty results', async function () {
      const id = randomUUID()
      diagnose.get(`/reports/${id}`)
        .reply(200, {
          app: 'myapp', checks: [
            {
              name: 'Connection count', results: [], status: 'red',
            }, {
              name: 'Load', results: {}, status: 'red',
            },
          ], created_at: '101', database: 'postgres-1', id,
        })
      await runCommand(Cmd, [
        '--app',
        'myapp',
        id,
      ])
      expect(normalizeTableOutput(stdout.output)).to.eq(normalizeTableOutput(heredoc(`
      Report ${id} for myapp::postgres-1
      available for one month after creation on 101

      RED: Connection count
      RED: Load
      `)))
    })

    it('roughly conforms with Ruby output', async function () {
      const id = randomUUID()
      diagnose.get(`/reports/${id}`)
        .reply(200, {
          app: 'appname', checks: [
            {name: 'Hit Rate', results: null, status: 'green'}, {name: 'Connection Count', results: [{count: 150}], status: 'red'}, {
              name: 'list', results: [{thing: 'one'}, {thing: 'two'}], status: 'yellow',
            }, {
              name: 'Load', results: {
                error: 'Load check not supported on this plan',
              }, status: 'skipped',
            },
          ], created_at: '2014-06-24 01:26:11.941197+00', database: 'dbcolor', id: 'abc123',
        })
      await runCommand(Cmd, [
        '--app',
        'myapp',
        id,
      ])
      expect(normalizeTableOutput(stdout.output)).to.eq(normalizeTableOutput(heredoc(`
      Report abc123 for appname::dbcolor
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
      `)))
    })

    it('converts underscores to spaces', async function () {
      const id = randomUUID()
      diagnose.get(`/reports/${id}`)
        .reply(200, {
          app: 'appname', checks: [
            {
              name: 'Load', results: {
                error_thing: 'Load check not supported on this plan',
              }, status: 'skipped',
            },
          ], created_at: '2014-06-24 01:26:11.941197+00', database: 'dbcolor', id: 'abc123',
        })
      await runCommand(Cmd, [
        '--app',
        'myapp',
        id,
      ])
      expect(normalizeTableOutput(stdout.output)).to.eq(normalizeTableOutput(heredoc(`
      Report abc123 for appname::dbcolor
      available for one month after creation on 2014-06-24 01:26:11.941197+00

      SKIPPED: Load
      Error Thing Load check not supported on this plan
      `)))
    })
  })
})
