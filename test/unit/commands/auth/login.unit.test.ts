import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'

import {APIClient} from '@heroku-cli/command'

import Login from '../../../../src/commands/auth/login.js'
import Git from '../../../../src/lib/git/git.js'
import {runCommand} from '../../../helpers/run-command.js'

describe('auth:login', function () {
  let api: nock.Scope
  let configureCredentialHelperStub: sinon.SinonStub
  let loginStub: sinon.SinonStub
  let savedApiKey: string | undefined

  beforeEach(function () {
    api = nock('https://api.heroku.com')

    savedApiKey = process.env.HEROKU_API_KEY
    delete process.env.HEROKU_API_KEY

    configureCredentialHelperStub = sinon.stub(Git.prototype, 'configureCredentialHelper').resolves()
    loginStub = sinon.stub(APIClient.prototype, 'login').resolves()
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()

    if (savedApiKey !== undefined) {
      process.env.HEROKU_API_KEY = savedApiKey
    }

    configureCredentialHelperStub.restore()
    loginStub.restore()
  })

  it('displays the logged in user', async function () {
    api
      .get('/account')
      .reply(200, {email: 'user@example.com'})

    const {stdout} = await runCommand(Login, [])

    expect(stdout).to.contain('Logged in as user@example.com')
  })

  it('configures git credential helper after successful login', async function () {
    api
      .get('/account')
      .reply(200, {
        email: 'user@example.com',
      })

    await runCommand(Login, [])

    expect(configureCredentialHelperStub.calledOnce).to.be.true
  })

  it('does not configure git credential helper if not logged in', async function () {
    loginStub.rejects(new Error('Not logged in'))

    await runCommand(Login, [])

    expect(configureCredentialHelperStub.notCalled).to.be.true
  })

  it('does not fail login if git credential helper configuration fails', async function () {
    configureCredentialHelperStub.rejects(new Error('Git not found'))

    api
      .get('/account')
      .reply(200, {
        email: 'user@example.com',
      })

    const {error} = await runCommand(Login, [])

    expect(error).to.be.undefined
    expect(configureCredentialHelperStub.calledOnce).to.be.true
  })
})
