import {stderr} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/pg/upgrade/dryrun'
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

describe('pg:upgrade:dryrun', function () {
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

  it('refuses to start test upgrade on essential tier dbs', async function () {
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
      expect(error.message).to.equal(`You can't use ${color.cmd('pg:upgrade:dryrun')} on Essential tier databases. You can only use this command on Standard-tier and higher leader databases.`)
    })
  })

  it('refuses to start test upgrade on follower dbs', async function () {
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
      You can't use ${color.cmd('pg:upgrade:dryrun')} on follower databases. You can only use this command on Standard-tier and higher leader databases.`))
    })
  })

  it('starts test upgrade on a db with version flag', async function () {
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
      .post(`/client/v11/databases/${addon.id}/upgrade/dry_run`)
      .reply(200, {message: "Started test upgrade. We'll notify you via email when it's complete."})

    const message = heredoc(`
      Destructive action
      This command starts a test upgrade for ${addon.name} to Postgres version 15.
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
      Starting a test upgrade on ${addon.name}...
      Starting a test upgrade on ${addon.name}... done
      Started test upgrade. We'll notify you via email when it's complete.
    `))
  })

  it('starts test upgrade on a db without a version flag', async function () {
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
      .post(`/client/v11/databases/${addon.id}/upgrade/dry_run`)
      .reply(200, {message: "Started test upgrade. We'll notify you via email when it's complete."})

    const message = heredoc(`
      Destructive action
      This command starts a test upgrade for ${addon.name} to the latest supported Postgres version.
      `)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(stripAnsi(uxPromptStub.args[0].toString())).contains('To proceed, type myapp')
    expect(stripAnsi(uxWarnStub.args[0].toString())).to.eq(message)

    expectOutput(stderr.output, heredoc(`
      Starting a test upgrade on ${addon.name}...
      Starting a test upgrade on ${addon.name}... done
      Started test upgrade. We'll notify you via email when it's complete.
    `))
  })

  it('errors if version upgrade task is running', async function () {
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
      .post(`/client/v11/databases/${addon.id}/upgrade/dry_run`)
      .reply(422, {id: 'unprocessable_entity', message: 'database is in the middle of a version upgrade. To perform this action, wait until the upgrade is complete and try again.'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ]).catch(error => {
      expect(error.message).to.equal(heredoc(`
      database is in the middle of a version upgrade. To perform this action, wait until the upgrade is complete and try again.
      
      Error ID: unprocessable_entity`))
    })
  })
})
