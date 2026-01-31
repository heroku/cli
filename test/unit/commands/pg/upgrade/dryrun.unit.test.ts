import {color, hux} from '@heroku/heroku-cli-util'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import * as sinon from 'sinon'
import {stderr} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/upgrade/dryrun.js'
import * as fixtures from '../../../../fixtures/addons/fixtures.js'
import runCommand from '../../../../helpers/runCommand.js'
import expectOutput from '../../../../helpers/utils/expectOutput.js'

const heredoc = tsheredoc.default

describe('pg:upgrade:dryrun', function () {
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
    addon = fixtures.addons['dwh-db']
    api = nock('https://api.heroku.com')
    dataApi = nock('https://api.data.heroku.com')
    uxWarnStub.resetHistory()
    uxPromptStub.resetHistory()
  })

  afterEach(async function () {
    api.done()
    dataApi.done()
    nock.cleanAll()
  })

  after(function () {
    uxWarnStub.restore()
    uxPromptStub.restore()
  })

  it('refuses to start test upgrade on legacy essential dbs', async function () {
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

  it('refuses to start test upgrade on essential tier dbs', async function () {
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
      expect(error.message).to.equal(`You can't use ${color.code('pg:upgrade:dryrun')} on Essential-tier databases. You can only use this command on Standard-tier and higher leader databases.`)
    })
  })

  it('refuses to start test upgrade on follower dbs', async function () {
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
      You can't use ${color.code('pg:upgrade:dryrun')} on follower databases. You can only use this command on Standard-tier and higher leader databases.`))
    })
  })

  it('starts test upgrade on a db with version flag', async function () {
    api
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    dataApi
      .get(`/client/v11/databases/${addon.id}`)
      .reply(200)
    dataApi
      .post(`/client/v11/databases/${addon.id}/upgrade/dry_run`)
      .reply(200, {message: "Started test upgrade. We'll notify you via email when it's complete."})

    const message = heredoc(`
      This command starts a test upgrade for ⛁ ${addon.name} to Postgres version 15.
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
      Starting a test upgrade on ⛁ ${addon.name}... done
      Started test upgrade. We'll notify you via email when it's complete.
    `))
  })

  it('starts test upgrade on a db without a version flag', async function () {
    api
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    dataApi
      .get(`/client/v11/databases/${addon.id}`)
      .reply(200)
    dataApi
      .post(`/client/v11/databases/${addon.id}/upgrade/dry_run`)
      .reply(200, {message: "Started test upgrade. We'll notify you via email when it's complete."})

    const message = heredoc(`
      This command starts a test upgrade for ⛁ ${addon.name} to the latest supported Postgres version.
      `)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(ansis.strip(uxPromptStub.args[0].toString())).contains('To proceed, type myapp')
    expect(ansis.strip(uxWarnStub.args[0].toString())).to.eq(message)

    expectOutput(stderr.output, heredoc(`
      Starting a test upgrade on ⛁ ${addon.name}... done
      Started test upgrade. We'll notify you via email when it's complete.
    `))
  })

  it('errors if version upgrade task is running', async function () {
    api
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    dataApi
      .get(`/client/v11/databases/${addon.id}`)
      .reply(200)
    dataApi
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
