import {stderr} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/pg/upgrade/cancel'
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

describe('pg:upgrade:cancel', function () {
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

  it('refuses to cancel upgrade on legacy essential dbs', async function () {
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

  it('refuses to cancel upgrade on essential tier dbs', async function () {
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
      expect(error.message).to.equal(`You can't use ${color.cmd('pg:upgrade:cancel')} on Essential tier databases. You can only use this command on Standard-tier and higher leader databases.`)
    })
  })

  it('refuses to cancel upgrade on follower dbs', async function () {
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
      You can't use ${color.cmd('pg:upgrade:cancel')} on follower databases.  You can only use this command on Standard-tier and higher leader databases.
    `))
    })
  })

  it('cancels upgrade on a leader db', async function () {
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
      .post(`/client/v11/databases/${addon.id}/upgrade/cancel`)
      .reply(200, {message: 'You canceled the upgrade.'})

    const message = heredoc(`
      Destructive action
      You're cancelling the version upgrade for ${addon.name}.
      
      You can't undo this action.
    `)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(stripAnsi(uxPromptStub.args[0].toString())).contains('To proceed, type myapp')
    expect(stripAnsi(uxWarnStub.args[0].toString())).to.eq(message)

    expectOutput(stderr.output, heredoc(`
      Cancelling upgrade on ${addon.name}...
      Cancelling upgrade on ${addon.name}... done
      You canceled the upgrade.
    `))
  })

  it('errors when there is no upgrade prepared', async function () {
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
      .post(`/client/v11/databases/${addon.id}/upgrade/cancel`)
      .reply(422, {id: 'bad_request', message: "You haven't scheduled an upgrade on your database. Run `pg:upgrade:prepare` to schedule an upgrade."})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ]).catch(error => {
      expectOutput(error.message, heredoc(`
      You haven't scheduled an upgrade on your database. Run ${color.cmd('pg:upgrade:prepare')} to schedule an upgrade.
      Error ID: bad_request
    `))

      expectOutput(stderr.output, heredoc(`
        Cancelling upgrade on ${addon.name}...
      `))
    })
  })

  it ('errors when upgrade is not cancelable', async function () {
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
      .post(`/client/v11/databases/${addon.id}/upgrade/cancel`)
      .reply(422, {id: 'bad_request', message: "You can't cancel the upgrade because it's currently in progress."})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ]).catch(error => {
      expectOutput(error.message, heredoc(`
      You can't cancel the upgrade because it's currently in progress.
      Error ID: bad_request
    `))

      expectOutput(stderr.output, heredoc(`
        Cancelling upgrade on ${addon.name}...
      `))
    })
  })
})
