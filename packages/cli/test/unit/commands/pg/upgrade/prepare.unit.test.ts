import {color, hux} from '@heroku/heroku-cli-util'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import * as sinon from 'sinon'
import {stderr} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/upgrade/prepare.js'
import * as fixtures from '../../../../fixtures/addons/fixtures.js'
import runCommand from '../../../../helpers/runCommand.js'
import expectOutput from '../../../../helpers/utils/expectOutput.js'

const heredoc = tsheredoc.default

describe('pg:upgrade:prepare', function () {
  let addon: Heroku.AddOn
  let uxWarnStub: sinon.SinonStub
  let uxPromptStub: sinon.SinonStub
  let api: nock.Scope
  let dataApi: nock.Scope

  before(function () {
    uxWarnStub = sinon.stub(ux, 'warn')
    uxPromptStub = sinon.stub(hux, 'prompt').resolves('myapp')
  })

  beforeEach(async function () {
    api = nock('https://api.heroku.com')
    dataApi = nock('https://api.data.heroku.com')
    addon = fixtures.addons['dwh-db']
    uxWarnStub.resetHistory()
    uxPromptStub.resetHistory()
  })

  afterEach(async function () {
    nock.cleanAll()
  })

  after(function () {
    uxWarnStub.restore()
    uxPromptStub.restore()
  })

  it('refuses to prepare upgrade on legacy essential dbs', async function () {
    const hobbyAddon = fixtures.addons['www-db']

    api
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon: hobbyAddon}])
    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ]).catch(error => {
      expectOutput(error.message, heredoc(`
      You can only use ${color.code('pg:upgrade:*')} commands on Essential-* and higher plans.
    `))
    })
  })

  it('refuses to prepare upgrade on essential tier dbs', async function () {
    const essentialAddon = {
      name: 'postgres-1', plan: {name: 'heroku-postgresql:essential-0'},
    }

    api
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon: essentialAddon}])

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ]).catch(error => {
      expect(error.message).to.equal(`You can only use ${color.code('heroku pg:upgrade:prepare')} on Standard-tier and higher leader databases. For Essential-tier databases, use ${color.code('heroku pg:upgrade:run')} instead.`)
    })
  })

  it('refuses to upgrade follower dbs', async function () {
    api
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    dataApi
      .get(`/client/v11/databases/${addon.id}`)
      .reply(200, {
        following: 'postgres://xxx.com:5432/abcdefghijklmn',
        leader: {
          addon_id: '5ba2ba8b-07a9-4a65-a808-585a50e37f98',
          name: 'postgresql-leader',
        },
      })
    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ]).catch(error => {
      expectOutput(error.message, heredoc(`
      You can only use ${color.code('heroku pg:upgrade:prepare')} on Standard-tier and higher leader databases. For follower databases, use ${color.code('heroku pg:upgrade:run')} instead.
    `))
    })
  })

  it('upgrades db with version flag', async function () {
    api
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    api
      .get('/apps/myapp/config-vars')
      .reply(200, {DATABASE_URL: 'postgres://db1'})
    dataApi
      .get(`/client/v11/databases/${addon.id}`)
      .reply(200)
    dataApi
      .post(`/client/v11/databases/${addon.id}/upgrade/prepare`)
      .reply(200, {message: 'Your database is scheduled for upgrade during your next available maintenance window.\nRun heroku pg:upgrade:wait to track its status.\nYou can also run this upgrade manually before the maintenance window with heroku pg:upgrade:run. You can only run the upgrade after it\'s fully prepared, which can take up to a day.'})

    const message = heredoc(`
      Destructive action
      This command prepares the upgrade for ⛁ ${addon.name} to Postgres version 15 and schedules to upgrade it during the next available maintenance window.
      `)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--version',
      '15',
    ])

    expect(ansis.strip(uxPromptStub.args[0].toString())).contains('To proceed, type myapp')
    expect(ansis.strip(uxWarnStub.args[0].toString())).to.eq(message)

    expectOutput(stderr.output, heredoc(`
      Preparing upgrade on ${addon.name}... done
      Your database is scheduled for upgrade during your next available maintenance window.
      Run heroku pg:upgrade:wait to track its status.
      You can also run this upgrade manually before the maintenance window with heroku pg:upgrade:run. You can only run the upgrade after it's fully prepared, which can take up to a day.
    `))
  })

  it('upgrades db without a version flag', async function () {
    api
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    api
      .get('/apps/myapp/config-vars')
      .reply(200, {DATABASE_URL: 'postgres://db1'})
    dataApi
      .get(`/client/v11/databases/${addon.id}`)
      .reply(200)
    dataApi
      .post(`/client/v11/databases/${addon.id}/upgrade/prepare`)
      .reply(200, {message: 'Your database is scheduled for upgrade during your next available maintenance window.\nRun heroku pg:upgrade:wait to track its status.\nYou can also run this upgrade manually before the maintenance window with heroku pg:upgrade:run. You can only run the upgrade after it\'s fully prepared, which can take up to a day.'})

    const message = heredoc(`
      Destructive action
      This command prepares the upgrade for ⛁ ${addon.name} to the latest supported Postgres version and schedules to upgrade it during the next available maintenance window.
      `)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(ansis.strip(uxPromptStub.args[0].toString())).contains('To proceed, type myapp')
    expect(ansis.strip(uxWarnStub.args[0].toString())).to.eq(message)

    expectOutput(stderr.output, heredoc(`
      Preparing upgrade on ${addon.name}... done
      Your database is scheduled for upgrade during your next available maintenance window.
      Run heroku pg:upgrade:wait to track its status.
      You can also run this upgrade manually before the maintenance window with heroku pg:upgrade:run. You can only run the upgrade after it's fully prepared, which can take up to a day.
    `))
  })

  it('catches the error', async function () {
    api
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    api
      .get('/apps/myapp/config-vars')
      .reply(200, {DATABASE_URL: 'postgres://db1'})
    dataApi
      .get(`/client/v11/databases/${addon.id}`)
      .reply(200)
    dataApi
      .post(`/client/v11/databases/${addon.id}/upgrade/prepare`)
      .reply(422, {id: 'unprocessable_entity', message: 'database has an upgrade already scheduled, please check `pg:upgrade:wait` for more information on the status of your upgrade.'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ]).catch(error => {
      expect(ansis.strip(error.message)).to.equal(heredoc(`
      database has an upgrade already scheduled, please check pg:upgrade:wait for more information on the status of your upgrade.

      Error ID: unprocessable_entity`))
    })
  })
})
