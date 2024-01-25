import {stdout} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/addons'
import runCommand from '../../../helpers/runCommand'
import * as fixtures from '../../../fixtures/addons/fixtures'
import * as nock from 'nock'
import {expect} from 'chai'
import expectOutput from '../../../helpers/utils/expectOutput'
import * as Heroku from '@heroku-cli/schema'

describe('addons', () => {
  describe('--all', function () {
    const addons = [
      fixtures.addons['www-db'], fixtures.addons['www-redis'], fixtures.addons['api-redis'],
    ]
    context('with add-ons', function () {
      beforeEach(function () {
        nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
          .get('/addons')
          .reply(200, addons)
      })
      it('prints add-ons in a table', async function () {
        await runCommand(Cmd, [])
        expectOutput(stdout.output, `
 Owning app   Add-on    Plan                   Price        Max price State
 ──────────── ───────── ────────────────────── ──────────── ───────── ────────
 acme-inc-api api-redis heroku-redis:premium-2 ~$0.083/hour $60/month created
 acme-inc-www www-db    heroku-postgresql:mini ~$0.007/hour $5/month  created
 acme-inc-www www-redis heroku-redis:premium-2 ~$0.083/hour $60/month creating`)
      })
      it('orders by app, then by add-on name', async function () {
        await runCommand(Cmd, [])
        expect(stdout.output.indexOf('acme-inc-api')).to.be.lt(stdout.output.indexOf('acme-inc-www'))
        expect(stdout.output.indexOf('www-db')).to.be.lt(stdout.output.indexOf('www-redis'))
      })
      context('--json', function () {
        it('prints the output in json format', async function () {
          await runCommand(Cmd, [
            '--json',
          ])
          expect(JSON.parse(stdout.output)[0].name).to.eq('www-db')
        })
      })
    })
    context('with a grandfathered add-on', function () {
      beforeEach(function () {
        const addon = fixtures.addons['dwh-db']
        addon.billed_price = {cents: 10000}
        nock('https://api.heroku.com', {reqheaders: {
          'Accept-Expansion': 'addon_service,plan',
        }})
          .get('/addons')
          .reply(200, [addon])
      })
      it('prints add-ons in a table with the grandfathered price', async function () {
        await runCommand(Cmd, [])
        expectOutput(stdout.output, `
 Owning app   Add-on Plan                         Price        Max price  State
 ──────────── ────── ──────────────────────────── ──────────── ────────── ───────
 acme-inc-dwh dwh-db heroku-postgresql:standard-2 ~$0.139/hour $100/month created`)
      })
    })
    context('with a contract add-on', function () {
      beforeEach(function () {
        const addon = fixtures.addons['dwh-db']
        addon.billed_price = {cents: 0, contract: true}
        nock('https://api.heroku.com', {reqheaders: {
          'Accept-Expansion': 'addon_service,plan',
        }})
          .get('/addons')
          .reply(200, [addon])
      })
      it('prints add-ons in a table with contract', async function () {
        await runCommand(Cmd, [])
        expectOutput(stdout.output, `
 Owning app   Add-on Plan                         Price    Max price State
 ──────────── ────── ──────────────────────────── ──────── ───────── ───────
 acme-inc-dwh dwh-db heroku-postgresql:standard-2 contract contract  created`)
      })
    })
    it('prints message when there are no add-ons', async function () {
      nock('https://api.heroku.com')
        .get('/addons')
        .reply(200, [])
      await runCommand(Cmd, [])
      expectOutput(stdout.output, 'No add-ons.')
    })
  })

  describe('--app', function () {
    function mockAPI(appName: string, addons: Heroku.AddOn[] = [], attachments: Heroku.AddOnAttachment[] = []) {
      nock('https://api.heroku.com', {reqheaders: {
        'Accept-Expansion': 'addon_service,plan',
      }})
        .get(`/apps/${appName}/addons`)
        .reply(200, addons)
      nock('https://api.heroku.com')
        .get('/addon-attachments')
        .reply(200, attachments)
    }

    function run(app: string, cb: () => any) {
      return runCommand(Cmd, [
        '--app',
        app,
      ])
        .then(cb)
    }

    it('prints message when there are no add-ons', function () {
      const appName = 'acme-inc-www'
      mockAPI(appName)
      return run(appName, function () {
        expectOutput(stdout.output, 'No add-ons for app acme-inc-www.')
      })
    })
    context('with add-ons', function () {
      it('prints add-ons in a table with attachments', function () {
        mockAPI('acme-inc-www', [
          fixtures.addons['www-db'], fixtures.addons['www-redis'],
        ], [
          fixtures.attachments['acme-inc-www::DATABASE'], fixtures.attachments['acme-inc-www::REDIS'],
        ])
        return run('acme-inc-www', function () {
          expectOutput(stdout.output, `
Add-on                     Plan      Price        Max price State
 ────────────────────────── ───────── ──────────── ───────── ────────
 heroku-postgresql (www-db) mini      ~$0.007/hour $5/month  created
  └─ as DATABASE
 heroku-redis (www-redis)   premium-2 ~$0.083/hour $60/month creating
  └─ as REDIS
The table above shows add-ons and the attachments to the current app (acme-inc-www) or other apps.`)
        })
      })
      it('shows attachments to foreign apps for owned add-ons', function () {
        mockAPI('acme-inc-www', [fixtures.addons['www-db']], [
          fixtures.attachments['acme-inc-www::DATABASE'], fixtures.attachments['acme-inc-dwh::WWW_DB'],
        ])
        return run('acme-inc-www', function () {
          expectOutput(stdout.output, `
Add-on                            Plan Price        Max price State
 ───────────────────────────────── ──── ──────────── ───────── ───────
 heroku-postgresql (www-db)        mini ~$0.007/hour $5/month  created
  ├─ as DATABASE
  └─ as WWW_DB on acme-inc-dwh app
The table above shows add-ons and the attachments to the current app (acme-inc-www) or other apps.
`)
        })
      })
      it('shows add-ons owned by foreign apps if attached to targeted app', function () {
        mockAPI('acme-inc-dwh', [fixtures.addons['www-db']], [
          fixtures.attachments['acme-inc-www::DATABASE'], fixtures.attachments['acme-inc-dwh::WWW_DB'],
        ])
        return run('acme-inc-dwh', function () {
          expectOutput(stdout.output, `
Add-on                              Plan Price                        Max price                    State
 ─────────────────────────────────── ──── ──────────────────────────── ──────────────────────────── ───────
 heroku-postgresql (www-db)          mini (billed to acme-inc-www app) (billed to acme-inc-www app) created
  ├─ as WWW_DB
  └─ as DATABASE on acme-inc-www app
The table above shows add-ons and the attachments to the current app (acme-inc-dwh) or other apps.`)
        })
      })
      it("doesn't show attachments that are not related to the targeted app", function () {
        mockAPI('acme-inc-dwh', [], [fixtures.attachments['acme-inc-www::DATABASE']])
        return run('acme-inc-dwh', function () {
          expectOutput(stdout.output, 'No add-ons for app acme-inc-dwh.')
        })
      })
      describe('attachment app info', function () {
        beforeEach(function () {
          mockAPI('acme-inc-dwh', [fixtures.addons['www-db']], [
            fixtures.attachments['acme-inc-www::DATABASE'], fixtures.attachments['acme-inc-dwh::WWW_DB'],
          ])
        })
        it('omits attachment app for local attachments', function () {
          return run('acme-inc-dwh', function () {
            expect(stdout.output).to.match(/├─ as WWW_DB\s*$/m)
          })
        })
        it('includes app name for foreign attachments', function () {
          return run('acme-inc-dwh', function () {
            expect(stdout.output).to.match(/└─ as DATABASE on acme-inc-www app\s*$/m)
          })
        })
      })
      describe('sorting', function () {
        context('add-ons', function () {
          it('sorts owned add-ons first, foreign add-ons second', function () {
            mockAPI('acme-inc-dwh', [
              fixtures.addons['dwh-db'], fixtures.addons['www-db'],
            ], [
              fixtures.attachments['acme-inc-dwh::DATABASE'], fixtures.attachments['acme-inc-dwh::WWW_DB'],
            ])
            return run('acme-inc-dwh', function () {
              expect(stdout.output.indexOf('dwh-db')).to.be.lt(stdout.output.indexOf('www-db'))
            })
          })
          it('sorts add-ons of same ownership by service', function () {
            mockAPI('acme-inc-www', [
              fixtures.addons['www-redis'], fixtures.addons['www-db'],
            ], [
              fixtures.attachments['acme-inc-www::REDIS'], fixtures.attachments['acme-inc-www::DATABASE'],
            ])
            return run('acme-inc-www', function () {
              expect(stdout.output.indexOf('heroku-postgresql')).to.be.lt(stdout.output.indexOf('heroku-redis'))
            })
          })
          it('sorts add-ons of same ownership and service by plan', function () {
            mockAPI('acme-inc-dwh', [
              fixtures.addons['dwh-db'], fixtures.addons['dwh-test-db'],
            ], [
              fixtures.attachments['acme-inc-dwh::DATABASE'], fixtures.attachments['acme-inc-dwh::TEST'],
            ])
            return run('acme-inc-dwh', function () {
              expect(stdout.output.indexOf('mini')).to.be.lt(stdout.output.indexOf('standard-2'))
            })
          })
          it('sorts add-ons of same ownership and service and plan by name', function () {
            mockAPI('acme-inc-dwh', [
              fixtures.addons['dwh-db-2'], fixtures.addons['dwh-db'],
            ], [
              fixtures.attachments['acme-inc-dwh::DATABASE'], fixtures.attachments['acme-inc-dwh::DATABASE_FOLLOWER'],
            ])
            return run('acme-inc-dwh', function () {
              expect(stdout.output.indexOf('(dwh-db)')).to.be.lt(stdout.output.indexOf('(dwh-db-2)'))
            })
          })
        })
        context('attachments', function () {
          it('sorts local attachments first', function () {
            mockAPI('acme-inc-dwh', [
              fixtures.addons['www-db'],
            ], [
              fixtures.attachments['acme-inc-www::DATABASE'], fixtures.attachments['acme-inc-dwh::WWW_DB'],
            ])
            return run('acme-inc-dwh', function () {
              expect(stdout.output.indexOf('as WWW_DB')).to.be.lt(stdout.output.indexOf('as DATABASE on acme-inc-www app'))
            })
          })
          it('sorts local attachments by name', function () {
            mockAPI('acme-inc-www', [fixtures.addons['www-db']], [
              fixtures.attachments['acme-inc-www::HEROKU_POSTGRESQL_RED'], fixtures.attachments['acme-inc-www::DATABASE'],
            ])
            return run('acme-inc-www', function () {
              expect(stdout.output.indexOf('DATABASE')).to.be.lt(stdout.output.indexOf('HEROKU_POSTGRESQL_RED'))
            })
          })
          it('sorts foreign attachments by app', function () {
            mockAPI('acme-inc-api', [fixtures.addons['www-db']], [
              fixtures.attachments['acme-inc-api::WWW_DB'], fixtures.attachments['acme-inc-dwh::WWW_DB'], fixtures.attachments['acme-inc-www::DATABASE'],
            ])
            return run('acme-inc-api', function () {
              expect(stdout.output.indexOf('as WWW_DB on acme-inc-dwh')).to.be.lt(stdout.output.indexOf('as DATABASE on acme-inc-www'))
            })
          })
          it('sorts foreign attachments for same app by name', function () {
            mockAPI('acme-inc-api', [fixtures.addons['www-db']], [
              fixtures.attachments['acme-inc-api::WWW_DB'], fixtures.attachments['acme-inc-www::DATABASE'], fixtures.attachments['acme-inc-www::HEROKU_POSTGRESQL_RED'],
            ])
            return run('acme-inc-api', function () {
              expect(stdout.output.indexOf('as DATABASE on acme-inc-www')).to.be.lt(stdout.output.indexOf('as HEROKU_POSTGRESQL_RED on acme-inc-www'))
            })
          })
        })
      })
    })
    context('with a grandfathered add-on', function () {
      beforeEach(function () {
        const addon = fixtures.addons['dwh-db']
        addon.billed_price = {cents: 10000}
        mockAPI('acme-inc-dwh', [
          addon,
        ], [
          fixtures.attachments['acme-inc-dwh::DATABASE'],
        ])
      })
      it('prints add-ons in a table with the grandfathered price', function () {
        return run('acme-inc-dwh', function () {
          expectOutput(stdout.output, `
Add-on                     Plan       Price        Max price  State
 ────────────────────────── ────────── ──────────── ────────── ───────
 heroku-postgresql (dwh-db) standard-2 ~$0.139/hour $100/month created
  └─ as DATABASE
The table above shows add-ons and the attachments to the current app (acme-inc-dwh) or other apps.`)
        })
      })
    })
    context('with a contract add-on', function () {
      beforeEach(function () {
        const addon = fixtures.addons['dwh-db']
        addon.billed_price = {cents: 0, contract: true}
        mockAPI('acme-inc-dwh', [
          addon,
        ], [
          fixtures.attachments['acme-inc-dwh::DATABASE'],
        ])
      })
      it('prints add-ons in a table with contract', function () {
        return run('acme-inc-dwh', function () {
          expectOutput(stdout.output, `
Add-on                     Plan       Price    Max price State
 ────────────────────────── ────────── ──────── ───────── ───────
 heroku-postgresql (dwh-db) standard-2 contract contract  created
  └─ as DATABASE
The table above shows add-ons and the attachments to the current app (acme-inc-dwh) or other apps.`)
        })
      })
    })
    it('prints add-on line for attachment when add-on info is missing from API (e.g. no permissions on billing app)', function () {
      mockAPI('acme-inc-api', [], [fixtures.attachments['acme-inc-api::WWW_DB']])
      return run('acme-inc-api', function () {
        expectOutput(stdout.output, `
Add-on        Plan Price                        Max price                    State
 ───────────── ──── ──────────────────────────── ──────────────────────────── ─────
 ? (www-db)    ?    (billed to acme-inc-www app) (billed to acme-inc-www app)
  └─ as WWW_DB
The table above shows add-ons and the attachments to the current app (acme-inc-api) or other apps.
`)
      })
    })
  })
})
