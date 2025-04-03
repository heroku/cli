import {stderr} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/pg/upgrade/index'
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
  const essentialAddon = fixtures.addons['www-db-3']
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

  it('refuses to upgrade legacy essential dbs', async function () {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon: hobbyAddon}])
    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ]).catch(error => {
      expect(error.message).to.equal(`You can only use ${color.cmd('heroku pg:upgrade')} on Essential-* databases and follower databases on Standard-tier and higher plans.`)
    })
  })

  it('refuses to upgrade standard tier leader db', async function () {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon: addon}])
    nock('https://api.heroku.com')
      .get('/apps/myapp/config-vars')
      .reply(200, {DATABASE_URL: 'postgres://db1'})
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}`)
      .reply(200)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ]).catch(error => {
      expect(error.message).to.equal(`You can only use ${color.cmd('heroku pg:upgrade')} on Essential-* databases and follower databases on Standard-tier and higher plans.`)
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
      .post(`/client/v11/databases/${addon.id}/upgrade`)
      .reply(200, {message: 'Upgrading'})

    const message = heredoc(`
      We’re deprecating this command. To upgrade your Postgres version, use the new pg:upgrade:* subcommands. See https://devcenter.heroku.com/changelog-items/3179.

      Destructive action
      You're upgrading ${addon.name} to Postgres version 15. The database will stop following DATABASE and become writable.

      This cannot be undone.
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
      Upgrading
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
      .post(`/client/v11/databases/${addon.id}/upgrade`)
      .reply(200, {message: 'Upgrading'})

    const message = heredoc(`
      We’re deprecating this command. To upgrade your Postgres version, use the new pg:upgrade:* subcommands. See https://devcenter.heroku.com/changelog-items/3179.

      Destructive action
      You're upgrading ${addon.name} to the latest supported Postgres version. The database will stop following DATABASE and become writable.

      This cannot be undone.
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
      Upgrading
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
      .post(`/client/v11/databases/${essentialAddon.id}/upgrade`)
      .reply(200, {message: 'Upgrading'})

    const message = heredoc(`
      We’re deprecating this command. To upgrade your Postgres version, use the new pg:upgrade:* subcommands. See https://devcenter.heroku.com/changelog-items/3179.

      Destructive action
      You're upgrading ${essentialAddon.name} to the latest supported Postgres version.

      This cannot be undone.
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
      Upgrading
    `))
  })
})
