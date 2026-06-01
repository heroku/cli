import * as Heroku from '@heroku-cli/schema'
import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {color, hux} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core/ux'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import * as sinon from 'sinon'
import {stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/upgrade/cancel.js'
import * as fixtures from '../../../../fixtures/addons/fixtures.js'
import {mockSDKData, MockSDK} from '../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc.default

describe('pg:upgrade:cancel', function () {
  let addon: Heroku.AddOn
  let uxWarnStub: sinon.SinonStub
  let uxPromptStub: sinon.SinonStub
  let api: nock.Scope
  let sdkMock: MockSDK
  let infoStub: ReturnType<typeof stub>
  let cancelUpgradeStub: ReturnType<typeof stub>

  before(function () {
    uxWarnStub = sinon.stub(ux, 'warn')
    uxPromptStub = sinon.stub(hux, 'prompt').resolves('myapp')
  })

  beforeEach(async function () {
    addon = fixtures.addons['dwh-db']
    api = nock('https://api.heroku.com')
    uxWarnStub.resetHistory()
    uxPromptStub.resetHistory()

    infoStub = stub()
    cancelUpgradeStub = stub()
    sdkMock = mockSDKData({
      database: {describe: infoStub, cancelUpgrade: cancelUpgradeStub},
    })
  })

  afterEach(async function () {
    sdkMock.restore()
    api.done()
    nock.cleanAll()
  })

  after(function () {
    uxWarnStub.restore()
    uxPromptStub.restore()
  })

  it('refuses to cancel upgrade on legacy essential dbs', async function () {
    const hobbyAddon = fixtures.addons['www-db']

    api
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon: hobbyAddon}])
    const {error} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ])
    expectOutput(error?.message ?? '', heredoc(`
      You can only use ${color.code('pg:upgrade:*')} commands on Essential-* and higher plans.
    `))
  })

  it('refuses to cancel upgrade on essential tier dbs', async function () {
    const essentialAddon = {
      name: 'postgres-1', plan: {name: 'heroku-postgresql:essential-0'},
    }

    api
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon: essentialAddon}])

    const {error} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ])
    expect(error?.message).to.equal(`You can't use ${color.code('pg:upgrade:cancel')} on Essential-tier databases. You can only use this command on Standard-tier and higher leader databases.`)
  })

  it('refuses to cancel upgrade on follower dbs', async function () {
    api
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    infoStub.resolves({
      following: 'postgres://xxx.com:5432/abcdefghijklmn',
      leader: {
        addon_id: '5ba2ba8b-07a9-4a65-a808-585a50e37f98',
        name: 'postgresql-leader',
      },
    })
    const {error} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ])
    expectOutput(error?.message ?? '', heredoc(`
      You can't use ${color.code('pg:upgrade:cancel')} on follower databases. You can only use this command on Standard-tier and higher leader databases.
    `))
  })

  it('cancels upgrade on a leader db', async function () {
    api
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    infoStub.resolves({})
    cancelUpgradeStub.resolves({message: 'You canceled the upgrade.'})

    const message = heredoc(`
      Destructive action
      You're canceling the scheduled version upgrade for ⛁ ${addon.name}.

      You can't undo this action.
    `)

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(ansis.strip(uxPromptStub.args[0].toString())).contains('To proceed, type myapp')
    expect(ansis.strip(uxWarnStub.args[0].toString())).to.eq(message)

    expectOutput(stderr, heredoc(`
      Cancelling upgrade on ${addon.name}... done
      You canceled the upgrade.
    `))
  })

  it('errors when there is no upgrade prepared', async function () {
    api
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    infoStub.resolves({})
    cancelUpgradeStub.rejects({statusCode: 422, id: 'bad_request', message: "You haven't scheduled an upgrade on your database. Run `pg:upgrade:prepare` to schedule an upgrade."})

    const {error, stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ])
    expectOutput(ansis.strip(error?.message ?? ''), heredoc(`
      You haven't scheduled an upgrade on your database. Run pg:upgrade:prepare to schedule an upgrade.

      Error ID: bad_request
    `))

    expectOutput(stderr, heredoc(`
        Cancelling upgrade on ${addon.name}...
      `))
  })

  it('errors when upgrade is not cancelable', async function () {
    api
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    infoStub.resolves({})
    cancelUpgradeStub.rejects({statusCode: 422, id: 'bad_request', message: "You can't cancel the upgrade because it's currently in progress."})

    const {error, stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ])
    expectOutput(error?.message ?? '', heredoc(`
      You can't cancel the upgrade because it's currently in progress.

      Error ID: bad_request
    `))

    expectOutput(stderr, heredoc(`
        Cancelling upgrade on ${addon.name}...
      `))
  })
})
