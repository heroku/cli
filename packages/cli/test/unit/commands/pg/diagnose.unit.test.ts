import type {AddOn, AddOnAttachment} from '@heroku-cli/schema'
import {expect} from '@oclif/test'
import * as nock from 'nock'
import {randomUUID} from 'node:crypto'
import {stdout} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import type {AddOnAttachmentWithConfigVarsAndPlan} from '../../../../src/lib/pg/types'
import Cmd  from '../../../../src/commands/pg/diagnose'
import runCommand from '../../../helpers/runCommand'

describe('pg:diagnose', function () {
  let api: nock.Scope
  let pg: nock.Scope
  let diagnose: nock.Scope
  let db: Pick<AddOnAttachmentWithConfigVarsAndPlan, 'id' | 'name' | 'plan' | 'config_vars' | 'app'>
  let dbName: string | undefined
  let app: { name: string; id?: string; }
  let addon: AddOn
  let plan: { name: string; id: string; }
  let attachment: AddOnAttachment
  let reportID: string
  const dbURL = 'postgres://user:password@herokupostgres.com/db'

  beforeEach(function () {
    plan = {
      name: 'heroku-postgresql:standard-0', id: randomUUID(),
    }
    db = {
      id: randomUUID(),
      name: dbName || 'DATABASE',
      get plan() {
        return plan
      },
      config_vars: ['DATABASE_ENDPOINT_042EExxx_URL', 'DATABASE_URL', 'HEROKU_POSTGRESQL_SILVER_URL'],
      app: {name: 'myapp'},
    }
    attachment = {
      id: '1', get name() {
        return db.name
      }, get config_vars() {
        return db.config_vars
      }, namespace: null,
    }
    app = {
      name: 'myapp', id: randomUUID(),
    }
    addon = {
      name: 'postgres-1', get id() {
        return db.id
      }, plan, app,
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
        id: reportID, app: app.name, database: 'DATABASE_URL', created_at: '101', checks: [
          {
            name: 'Connection count', status: 'red', results: [{count: 1}],
          }, {
            name: 'Load', status: 'red', results: {load: 100},
          },
        ],
      }
      diagnose.post('/reports', {
        url: dbURL, plan: 'standard-0', app: app.name, database: 'DATABASE_URL', metrics: [],
      }).reply(200, report)

      await runCommand(Cmd, [
        '--app',
        app.name,
      ])
      expect(stdout.output).to.equal(heredoc(`
      Report ${reportID} for ${app.name}::${report.database}
      available for one month after creation on 101
      
      RED: Connection count
       Count 
       ───── 
       1     
      RED: Load
      Load 100
      `))
    })
  })

  describe('when passing arguments', function () {
    context('and this argument is a report ID', function () {
      it('displays an existing report', async function () {
        dbName = 'HEROKU_POSTGRESQL_SILVER'
        const report = {
          id: reportID, app: app.name, database: addon.name, created_at: '101', checks: [
            {
              name: 'Connection count', status: 'red', results: [{count: 1}],
            }, {
              name: 'Load', status: 'red', results: {load: 100},
            },
          ],
        }
        diagnose.get(`/reports/${reportID}`).reply(200, report)
        await runCommand(Cmd, [
          '--app',
          app.name,
          reportID,
        ])
        expect(stdout.output).to.equal(heredoc(`
        Report ${reportID} for ${app.name}::${report.database}
        available for one month after creation on 101
      
        RED: Connection count
         Count 
         ───── 
         1     
        RED: Load
        Load 100
        `))
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
          id: reportID, app: app.name, database: 'HEROKU_POSTGRESQL_SILVER_URL', created_at: '101', checks: [
            {
              name: 'Connection count', status: 'red', results: [{count: 1}],
            }, {
              name: 'Load', status: 'red', results: {load: 100},
            },
          ],
        }
        diagnose.post('/reports', {
          url: dbURL, plan: 'standard-0', app: app.name, database: 'HEROKU_POSTGRESQL_SILVER_URL', metrics: [],
        })
          .reply(200, report)
        await runCommand(Cmd, [
          '--app',
          'myapp',
        ])
        expect(stdout.output).to.equal(heredoc(`
        Report ${reportID} for ${app.name}::${report.database}
        available for one month after creation on 101

        RED: Connection count
         Count 
         ───── 
         1     
        RED: Load
        Load 100
        `))
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
            id: reportID, app: app.name, database: 'DATABASE_URL', created_at: '101', checks: [
              {
                name: 'Connection count', status: 'red', results: [{count: 1}],
              }, {
                name: 'Load', status: 'red', results: {load: 100},
              },
            ],
          }
          diagnose.post('/reports', {
            url: dbURL, plan: 'standard-0', app: app.name, database: 'DATABASE_URL', metrics: [],
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
          id, app: 'myapp', database: 'postgres-1', created_at: '101', checks: [
            {
              name: 'Connection count', status: 'red', results: [],
            }, {
              name: 'Load', status: 'red', results: {},
            },
          ],
        })
      await runCommand(Cmd, [
        '--app',
        'myapp',
        id,
      ])
      expect(stdout.output).to.equal(heredoc(`
      Report ${id} for myapp::postgres-1
      available for one month after creation on 101

      RED: Connection count
      RED: Load
      `))
    })

    it('roughly conforms with Ruby output', async function () {
      const id = randomUUID()
      diagnose.get(`/reports/${id}`)
        .reply(200, {
          id: 'abc123', app: 'appname', created_at: '2014-06-24 01:26:11.941197+00', database: 'dbcolor', checks: [
            {name: 'Hit Rate', status: 'green', results: null}, {name: 'Connection Count', status: 'red', results: [{count: 150}]}, {
              name: 'list', status: 'yellow', results: [{thing: 'one'}, {thing: 'two'}],
            }, {
              name: 'Load', status: 'skipped', results: {
                error: 'Load check not supported on this plan',
              },
            },
          ],
        })
      await runCommand(Cmd, [
        '--app',
        'myapp',
        id,
      ])
      expect(stdout.output).to.equal(heredoc(`
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
      `))
    })

    it('converts underscores to spaces', async function () {
      const id = randomUUID()
      diagnose.get(`/reports/${id}`)
        .reply(200, {
          id: 'abc123', app: 'appname', created_at: '2014-06-24 01:26:11.941197+00', database: 'dbcolor', checks: [
            {
              name: 'Load', status: 'skipped', results: {
                error_thing: 'Load check not supported on this plan',
              },
            },
          ],
        })
      await runCommand(Cmd, [
        '--app',
        'myapp',
        id,
      ])
      expect(stdout.output).to.equal(heredoc(`
      Report abc123 for appname::dbcolor
      available for one month after creation on 2014-06-24 01:26:11.941197+00

      SKIPPED: Load
      Error Thing Load check not supported on this plan
      `))
    })
  })
})
