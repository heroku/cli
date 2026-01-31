import {color, hux} from '@heroku/heroku-cli-util'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import * as sinon from 'sinon'
import {stderr} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/upgrade/run.js'
import * as fixtures from '../../../../fixtures/addons/fixtures.js'
import runCommand from '../../../../helpers/runCommand.js'
import expectOutput from '../../../../helpers/utils/expectOutput.js'

const heredoc = tsheredoc.default

describe('pg:upgrade:run', function () {
  let hobbyAddon: Heroku.AddOn
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
    hobbyAddon = fixtures.addons['www-db']
    addon = fixtures.addons['dwh-db']
    uxWarnStub.resetHistory()
    uxPromptStub.resetHistory()
  })

  afterEach(async function () {
    nock.cleanAll()
    api.done()
  })

  after(function () {
    uxWarnStub.restore()
    uxPromptStub.restore()
  })

  it('refuses to start test upgrade on legacy essential dbs', async function () {
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

  it('upgrades follower db with version flag', async function () {
    api
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    api
      .get('/apps/myapp/config-vars')
      .reply(200, {DATABASE_URL: 'postgres://db1'})
    dataApi
      .get(`/client/v11/databases/${addon.id}`)
      .reply(200, {following: 'postgres://db1'})
    dataApi
      .post(`/client/v11/databases/${addon.id}/upgrade/run`)
      .reply(200, {message: 'Started the upgrade. You can monitor the progress with `heroku pg:upgrade:wait`.'})

    const message = heredoc(`
      Destructive action
      You're upgrading ${addon.name} to Postgres version 15. The database will stop following DATABASE and become writable.

      You can't undo this action.
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
      Starting upgrade on ⛁ ${addon.name}... done
      Started the upgrade. You can monitor the progress with heroku pg:upgrade:wait.
    `))
  })

  it('upgrades follower db without version flag', async function () {
    api
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    api
      .get('/apps/myapp/config-vars')
      .reply(200, {DATABASE_URL: 'postgres://db1'})
    dataApi
      .get(`/client/v11/databases/${addon.id}`)
      .reply(200, {following: 'postgres://db1'})
      .post(`/client/v11/databases/${addon.id}/upgrade/run`)
      .reply(200, {message: 'Started the upgrade. You can monitor the progress with `heroku pg:upgrade:wait`.'})

    const message = heredoc(`
      Destructive action
      You're upgrading ${addon.name} to the latest supported Postgres version. The database will stop following DATABASE and become writable.

      You can't undo this action.
    `)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(ansis.strip(uxPromptStub.args[0].toString())).contains('To proceed, type myapp')
    expect(ansis.strip(uxWarnStub.args[0].toString())).to.eq(message)

    expectOutput(stderr.output, heredoc(`
      Starting upgrade on ⛁ ${addon.name}... done
      Started the upgrade. You can monitor the progress with heroku pg:upgrade:wait.
    `))
  })

  it('upgrades essential db', async function () {
    const essentialAddon = {
      id: 'b68d8f51-6577-4a46-a617-c5f36f1bb031', name: 'postgres-1', plan: {name: 'heroku-postgresql:essential-0'},
    }

    api
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon: essentialAddon}])
    api
      .get('/apps/myapp/config-vars')
      .reply(200, {DATABASE_URL: 'postgres://db1'})
    dataApi
      .get(`/client/v11/databases/${essentialAddon.id}`)
      .reply(200)
      .post(`/client/v11/databases/${essentialAddon.id}/upgrade/run`)
      .reply(200, {message: 'Started the upgrade. You can monitor the progress with `heroku pg:upgrade:wait.`'})

    const message = heredoc(`
      Destructive action
      You're upgrading ${essentialAddon.name} to the latest supported Postgres version.

      You can't undo this action.
    `)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(ansis.strip(uxPromptStub.args[0].toString())).contains('To proceed, type myapp')
    expect(ansis.strip(uxWarnStub.args[0].toString())).to.eq(message)

    expectOutput(stderr.output, heredoc(`
      Starting upgrade on ⛁ ${essentialAddon.name}... done
      Started the upgrade. You can monitor the progress with heroku pg:upgrade:wait.
    `))
  })

  it('errors when there is no upgrade prepared on leader db', async function () {
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
      .post(`/client/v11/databases/${addon.id}/upgrade/run`)
      .reply(400, {id: 'bad_request', message: "You haven't scheduled a version upgrade on your database. Run `heroku pg:upgrade:prepare` to schedule an upgrade."})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ]).catch(error => {
      expectOutput(ansis.strip(error.message), heredoc(`
        You haven't scheduled a version upgrade on your database. Run heroku pg:upgrade:prepare to schedule an upgrade.

        Error ID: bad_request
      `))
    })
  })

  it('errors when leader db is not yet ready for upgrade', async function () {
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
      .post(`/client/v11/databases/${addon.id}/upgrade/run`)
      .reply(400, {id: 'bad_request', message: 'Your database is not ready for upgrade. Please try running your upgrade later. You can check the status of your upgrade with `heroku pg:upgrade:wait`.'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ]).catch(error => {
      expectOutput(ansis.strip(error.message), heredoc(`
        Your database is not ready for upgrade. Please try running your upgrade later. You can check the status of your upgrade with heroku pg:upgrade:wait.

        Error ID: bad_request
      `))
    })
  })

  it('runs a scheduled upgrade on a leader db', async function () {
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
      .post(`/client/v11/databases/${addon.id}/upgrade/run`)
      .reply(200, {message: 'Started the upgrade. You can monitor the progress with `heroku pg:upgrade:wait.`'})

    const message = heredoc(`
      Destructive action
      You're upgrading the Postgres version on ⛁ ${addon.name}. This action also upgrades any followers on the database.

      You can't undo this action.
    `)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(ansis.strip(uxPromptStub.args[0].toString())).contains('To proceed, type myapp')
    expect(ansis.strip(uxWarnStub.args[0].toString())).to.eq(message)

    expectOutput(stderr.output, heredoc(`
      Starting upgrade on ⛁ ${addon.name}... done
      Started the upgrade. You can monitor the progress with heroku pg:upgrade:wait.
    `))
  })
})
