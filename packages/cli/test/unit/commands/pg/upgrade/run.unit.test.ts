import {stderr} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/pg/upgrade/run'
import runCommand from '../../../../helpers/runCommand'
import expectOutput from '../../../../helpers/utils/expectOutput'
import {expect} from 'chai'
import * as nock from 'nock'
import heredoc from 'tsheredoc'
import * as fixtures from '../../../../fixtures/addons/fixtures'
import color from '@heroku-cli/color'
import {ux} from '@oclif/core'
import * as sinon from 'sinon'
const stripAnsi = require('strip-ansi')

describe('pg:upgrade', function () {
  const hobbyAddon = fixtures.addons['www-db']
  const addon = fixtures.addons['dwh-db']
  let uxWarnStub: sinon.SinonStub
  let uxPromptStub: sinon.SinonStub

  before(function () {
    uxWarnStub = sinon.stub(ux, 'warn')
    uxPromptStub = sinon.stub(ux, 'prompt').resolves('myapp')
  })

  beforeEach(async function () {
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

  it('refuses to start test upgrade on legacy essential dbs', async function () {
    const hobbyAddon = fixtures.addons['www-db']

    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon: hobbyAddon}])
    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ]).catch(error => {
      expectOutput(error.message, heredoc(`
      You can only use ${color.cmd('pg:upgrade:*')} commands on Essential-* and higher plans.
    `))
    })
  })

  it('upgrades follower db with version flag', async function () {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    nock('https://api.heroku.com')
      .get('/apps/myapp/config-vars')
      .reply(200, {DATABASE_URL: 'postgres://db1'})
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}`)
      .reply(200, {following: 'postgres://db1'})
    nock('https://api.data.heroku.com')
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

    expect(stripAnsi(uxPromptStub.args[0].toString())).contains('To proceed, type myapp')
    expect(stripAnsi(uxWarnStub.args[0].toString())).to.eq(message)

    expectOutput(stderr.output, heredoc(`
      Starting upgrade on ${addon.name}...
      Starting upgrade on ${addon.name}... done
      Started the upgrade. You can monitor the progress with heroku pg:upgrade:wait.
    `))
  })

  it('upgrades follower db without version flag', async function () {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    nock('https://api.heroku.com')
      .get('/apps/myapp/config-vars')
      .reply(200, {DATABASE_URL: 'postgres://db1'})
    nock('https://api.data.heroku.com')
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

    expect(stripAnsi(uxPromptStub.args[0].toString())).contains('To proceed, type myapp')
    expect(stripAnsi(uxWarnStub.args[0].toString())).to.eq(message)

    expectOutput(stderr.output, heredoc(`
      Starting upgrade on ${addon.name}...
      Starting upgrade on ${addon.name}... done
      Started the upgrade. You can monitor the progress with heroku pg:upgrade:wait.
    `))
  })

  it('upgrades essential db', async function () {
    const essentialAddon = {
      name: 'postgres-1', plan: {name: 'heroku-postgresql:essential-0'}, id: 'b68d8f51-6577-4a46-a617-c5f36f1bb031',
    }

    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon: essentialAddon}])
    nock('https://api.heroku.com')
      .get('/apps/myapp/config-vars')
      .reply(200, {DATABASE_URL: 'postgres://db1'})
    nock('https://api.data.heroku.com')
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

    expect(stripAnsi(uxPromptStub.args[0].toString())).contains('To proceed, type myapp')
    expect(stripAnsi(uxWarnStub.args[0].toString())).to.eq(message)

    expectOutput(stderr.output, heredoc(`
      Starting upgrade on ${essentialAddon.name}...
      Starting upgrade on ${essentialAddon.name}... done
      Started the upgrade. You can monitor the progress with heroku pg:upgrade:wait.
    `))
  })

  it('errors when there is no upgrade prepared on leader db', async function () {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    nock('https://api.heroku.com')
      .get('/apps/myapp/config-vars')
      .reply(200, {DATABASE_URL: 'postgres://db1'})
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}`)
      .reply(200)
    nock('https://api.data.heroku.com')
      .post(`/client/v11/databases/${addon.id}/upgrade/run`)
      .reply(400, {id: 'bad_request', message: "You haven't scheduled a version upgrade on your database. Run `heroku pg:upgrade:prepare` to schedule an upgrade."})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ]).catch(error => {
      expectOutput(error.message, heredoc(`
        You haven't scheduled a version upgrade on your database. Run ${color.cmd('heroku pg:upgrade:prepare')} to schedule an upgrade.

        Error ID: bad_request
      `))
    })
  })

  it('errors when leader db is not yet ready for upgrade', async function () {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    nock('https://api.heroku.com')
      .get('/apps/myapp/config-vars')
      .reply(200, {DATABASE_URL: 'postgres://db1'})
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}`)
      .reply(200)
    nock('https://api.data.heroku.com')
      .post(`/client/v11/databases/${addon.id}/upgrade/run`)
      .reply(400, {id: 'bad_request', message: "Your database is not ready for upgrade. Please try running your upgrade later. You can check the status of your upgrade with `heroku pg:upgrade:wait`."})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ]).catch(error => {
      expectOutput(error.message, heredoc(`
        Your database is not ready for upgrade. Please try running your upgrade later. You can check the status of your upgrade with ${color.cmd('heroku pg:upgrade:wait')}.

        Error ID: bad_request
      `))
    })
  })

  it('runs a scheduled upgrade on a leader db', async function () {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    nock('https://api.heroku.com')
      .get('/apps/myapp/config-vars')
      .reply(200, {DATABASE_URL: 'postgres://db1'})
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}`)
      .reply(200)
    nock('https://api.data.heroku.com')
      .post(`/client/v11/databases/${addon.id}/upgrade/run`)
      .reply(200, {message: 'Started the upgrade. You can monitor the progress with `heroku pg:upgrade:wait.`'})

    const message = heredoc(`
      Destructive action
      You're upgrading the Postgres version on ${addon.name}. This action also upgrades any followers on the database.

      You can't undo this action.
    `)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
  
    expect(stripAnsi(uxPromptStub.args[0].toString())).contains('To proceed, type myapp')
    expect(stripAnsi(uxWarnStub.args[0].toString())).to.eq(message)

    expectOutput(stderr.output, heredoc(`
      Starting upgrade on ${addon.name}...
      Starting upgrade on ${addon.name}... done
      Started the upgrade. You can monitor the progress with heroku pg:upgrade:wait.
    `))
  }) 
})
