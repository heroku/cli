import {stderr} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/pg/upgrade/prepare'
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

describe('pg:upgrade:prepare', function () {
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

  it('refuses to prepare upgrade on legacy essential dbs', async function () {
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

  it('refuses to prepare upgrade on essential tier dbs', async function () {
    const essentialAddon = {
      name: 'postgres-1', plan: {name: 'heroku-postgresql:essential-0'},
    }

    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon: essentialAddon}])

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ]).catch(error => {
      expect(error.message).to.equal(`You can only use ${color.cmd('heroku pg:upgrade:prepare')} on Standard-tier and higher leader databases. For Essential-tier databases, use ${color.cmd('heroku pg:upgrade:run')} instead.`)
    })
  })

  it('refuses to upgrade follower dbs', async function () {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon: addon}])
    nock('https://api.data.heroku.com')
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
      You can only use ${color.cmd('heroku pg:upgrade:prepare')} on Standard-tier and higher leader databases. For follower databases, use ${color.cmd('heroku pg:upgrade:run')} instead.
    `))
    })
  })

  it('upgrades db with version flag', async function () {
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
      .post(`/client/v11/databases/${addon.id}/upgrade/prepare`)
      .reply(200, {message: 'Your database is scheduled for upgrade during your next available maintenance window.\nRun heroku pg:upgrade:wait to track its status.\nYou can also run this upgrade manually before the maintenance window with heroku pg:upgrade:run. You can only run the upgrade after it\'s fully prepared, which can take up to a day.'})

    const message = heredoc(`
      Destructive action
      This command prepares the upgrade for ${addon.name} to Postgres version 15 and schedules to upgrade it during the next available maintenance window.
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
      Preparing upgrade on ${addon.name}...
      Preparing upgrade on ${addon.name}... done
      Your database is scheduled for upgrade during your next available maintenance window.
      Run heroku pg:upgrade:wait to track its status.
      You can also run this upgrade manually before the maintenance window with heroku pg:upgrade:run. You can only run the upgrade after it's fully prepared, which can take up to a day.
    `))
  })

  it('upgrades db without a version flag', async function () {
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
      .post(`/client/v11/databases/${addon.id}/upgrade/prepare`)
      .reply(200, {message: 'Your database is scheduled for upgrade during your next available maintenance window.\nRun heroku pg:upgrade:wait to track its status.\nYou can also run this upgrade manually before the maintenance window with heroku pg:upgrade:run. You can only run the upgrade after it\'s fully prepared, which can take up to a day.'})

    const message = heredoc(`
      Destructive action
      This command prepares the upgrade for ${addon.name} to the latest supported Postgres version and schedules to upgrade it during the next available maintenance window.
      `)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(stripAnsi(uxPromptStub.args[0].toString())).contains('To proceed, type myapp')
    expect(stripAnsi(uxWarnStub.args[0].toString())).to.eq(message)

    expectOutput(stderr.output, heredoc(`
      Preparing upgrade on ${addon.name}...
      Preparing upgrade on ${addon.name}... done
      Your database is scheduled for upgrade during your next available maintenance window.
      Run heroku pg:upgrade:wait to track its status.
      You can also run this upgrade manually before the maintenance window with heroku pg:upgrade:run. You can only run the upgrade after it's fully prepared, which can take up to a day.
    `))
  })

  it('catches the error', async function () {
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
      .post(`/client/v11/databases/${addon.id}/upgrade/prepare`)
      .reply(422, {id: 'unprocessable_entity', message: 'database has an upgrade already scheduled, please check `pg:upgrade:wait` for more information on the status of your upgrade.'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ]).catch(error => {
      expect(error.message).to.equal(heredoc(`
      database has an upgrade already scheduled, please check ${color.cmd('pg:upgrade:wait')} for more information on the status of your upgrade.
      
      Error ID: unprocessable_entity`))
    })
  })
})
