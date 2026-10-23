import {APIClient} from '@heroku-cli/command'
import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import nock from 'nock'
import {restore, SinonStub, stub} from 'sinon'

import Whoami from '../../../../src/commands/auth/whoami.js'

type FakePlatform = {
  account: {getWithDelinquency: SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    account: {getWithDelinquency: stub()},
  }
}

describe('auth:whoami', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
    stub(APIClient.prototype, 'auth').get(() => 'foobar')
  })

  afterEach(function () {
    delete process.env.HEROKU_API_KEY
    restore()
  })

  it('shows user email when logged in', async function () {
    fakePlatform.account.getWithDelinquency.resolves({account: {email: 'gandalf@example.com'}, delinquency: null})

    const {stdout} = await runCommand(Whoami, [])

    expect(stdout).to.equal('gandalf@example.com\n')
    expect(fakePlatform.account.getWithDelinquency.calledOnce).to.equal(true)
  })

  it('exits with status 100 when not logged in', async function () {
    const error = Object.assign(new Error('Unauthorized'), {statusCode: 401})
    fakePlatform.account.getWithDelinquency.rejects(error)

    const {error: cmdError} = await runCommand(Whoami, [])

    expect(cmdError?.oclif?.exit).to.equal(100)
  })

  it('surfaces a delinquency warning when the account is delinquent', async function () {
    const suspensionTime = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)) // a week out
    fakePlatform.account.getWithDelinquency.resolves({
      account: {email: 'gandalf@example.com'},
      delinquency: {scheduled_deletion_time: null, scheduled_suspension_time: suspensionTime.toISOString()},
    })

    const {stderr, stdout} = await runCommand(Whoami, [])

    expect(stdout).to.equal('gandalf@example.com\n')
    expect(stderr).to.contain('delinquent with payment')
    expect(stderr).to.contain(suspensionTime.toUTCString())
  })

  it('emits no delinquency warning when the account is not delinquent', async function () {
    fakePlatform.account.getWithDelinquency.resolves({account: {email: 'gandalf@example.com'}, delinquency: null})

    const {stderr} = await runCommand(Whoami, [])

    expect(stderr).to.not.contain('delinquent')
  })

  it('shows a warning when the HEROKU_API_KEY env var is set', async function () {
    process.env.HEROKU_API_KEY = 'foobar'
    fakePlatform.account.getWithDelinquency.resolves({account: {email: 'gandalf@example.com'}, delinquency: null})

    const {stderr, stdout} = await runCommand(Whoami, [])

    expect(stderr).to.contain('Warning: HEROKU_API_KEY is set')
    expect(stdout).to.equal('gandalf@example.com\n')
  })
})

describe('auth:whoami reauthorize opt-out', function () {
  // whoami passes reauthorize: undefined to createSDK, so an expired/invalid
  // token must report "not logged in" rather than drive an interactive login.
  // Runs the real SDK over nock (no platform getter stub) so the opt-out is
  // exercised end to end: login() is the behavior that discriminates the opt-out
  // from the default (both paths still end in a 401), so we assert it never fires.
  afterEach(function () {
    delete process.env.HEROKU_API_KEY
    nock.cleanAll()
    restore()
  })

  it('never prompts for re-login on a 401', async function () {
    const login = stub(APIClient.prototype, 'login').resolves()
    stub(APIClient.prototype, 'getAuthEntry').resolves({account: undefined, token: 'stale-token'})
    stub(APIClient.prototype, 'auth').get(() => 'stale-token')
    nock('https://api.heroku.com').persist().get(/.*/).reply(401, {id: 'unauthorized'})

    const {error} = await runCommand(Whoami, [])

    expect(login.called).to.equal(false)
    expect(error?.oclif?.exit).to.equal(100)
  })
})
