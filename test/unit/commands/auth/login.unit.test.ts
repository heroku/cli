import {APIClient} from '@heroku-cli/command'
import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'

import Login from '../../../../src/commands/auth/login.js'
import Git from '../../../../src/lib/git/git.js'

type FakePlatform = {
  account: {info: SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    account: {info: stub()},
  }
}

describe('auth:login', function () {
  let fakePlatform: FakePlatform
  let configureCredentialHelperStub: SinonStub
  let eraseCredentialsStub: SinonStub
  let loginStub: SinonStub
  let savedApiKey: string | undefined

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)

    savedApiKey = process.env.HEROKU_API_KEY
    delete process.env.HEROKU_API_KEY

    configureCredentialHelperStub = stub(Git.prototype, 'configureCredentialHelper').resolves()
    eraseCredentialsStub = stub(Git.prototype, 'eraseCredentials').resolves()
    loginStub = stub(APIClient.prototype, 'login').resolves()
  })

  afterEach(function () {
    if (savedApiKey !== undefined) {
      process.env.HEROKU_API_KEY = savedApiKey
    }

    restore()
  })

  it('displays the logged in user', async function () {
    fakePlatform.account.info.resolves({email: 'user@example.com'})

    const {stdout} = await runCommand(Login, [])

    expect(stdout).to.contain('Logged in as user@example.com')
  })

  it('configures git credential helper after successful login', async function () {
    fakePlatform.account.info.resolves({
      email: 'user@example.com',
    })

    await runCommand(Login, [])

    expect(configureCredentialHelperStub.calledOnce).to.be.true
  })

  it('rejects stale git credentials after successful login', async function () {
    fakePlatform.account.info.resolves({
      email: 'user@example.com',
    })

    await runCommand(Login, [])

    expect(eraseCredentialsStub.calledOnce).to.be.true
  })

  it('does not perform git operations if not logged in', async function () {
    loginStub.rejects(new Error('Not logged in'))

    await runCommand(Login, [])

    expect(configureCredentialHelperStub.notCalled).to.be.true
    expect(eraseCredentialsStub.notCalled).to.be.true
  })

  it('does not fail login if git credential helper configuration fails', async function () {
    configureCredentialHelperStub.rejects(new Error('Git not found'))

    fakePlatform.account.info.resolves({
      email: 'user@example.com',
    })

    const {error} = await runCommand(Login, [])

    expect(error).to.be.undefined
    expect(configureCredentialHelperStub.calledOnce).to.be.true
  })

  it('does not fail login if git credential deletion fails', async function () {
    eraseCredentialsStub.rejects(new Error('Git not found'))

    fakePlatform.account.info.resolves({
      email: 'user@example.com',
    })

    const {error} = await runCommand(Login, [])

    expect(error).to.be.undefined
    expect(eraseCredentialsStub.calledOnce).to.be.true
  })
})
