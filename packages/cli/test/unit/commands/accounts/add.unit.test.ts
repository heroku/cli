import {expect} from 'chai'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import * as sinon from 'sinon'
import Cmd from '../../../../src/commands/accounts/add'
import * as accounts from '../../../../src/lib/accounts/accounts'
import {APIClient} from '@heroku-cli/command'
import {hux} from '@heroku/heroku-cli-util'
import * as proxyquire from 'proxyquire'

describe('accounts:add', function () {
  let api: nock.Scope
  let addStub: sinon.SinonStub
  let loginStub: sinon.SinonStub
  let confirmStub: sinon.SinonStub

  beforeEach(function () {
    sinon.stub(accounts, 'list').returns([])
    confirmStub = sinon.stub(hux, 'confirm').resolves(false)
    addStub = sinon.stub(accounts, 'add')
    loginStub = sinon.stub(APIClient.prototype, 'login').resolves()
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    delete process.env.HEROKU_API_KEY
    sinon.restore()
    api.done()
    nock.cleanAll()
  })

  describe('when the sso flag is not set', function () {
    it('should warn the user that they may be logged in with a different account in the browser', async function () {
      process.env.HEROKU_API_KEY = 'testHerokuAPIKey'
      api.get('/account')
        .reply(200, {email: 'testEmail'})

      await runCommand(Cmd, ['testAccountName'])

      expect(confirmStub.calledWith('Redirect to Dashboard for sign out?')).to.equal(true)
    })

    it('should log the user in using the browser method', async function () {
      process.env.HEROKU_API_KEY = 'testHerokuAPIKey'
      api.get('/account')
        .reply(200, {email: 'testEmail'})

      await runCommand(Cmd, ['testAccountName'])

      expect(loginStub.called).to.equal(true)
      expect(loginStub.calledWith({method: 'browser', expiresIn: undefined, browser: undefined})).to.equal(true)
    })

    it('should open dashboard if the user confirms they would like to logout in the browser', async function () {
      process.env.HEROKU_API_KEY = 'testHerokuAPIKey'
      const openStub = sinon.stub()
      confirmStub.resolves(true)
      const {default: proxyCmd} = proxyquire(
        '../../../../src/commands/accounts/add',
        {open: openStub},
      )
      api.get('/account')
        .reply(200, {email: 'testEmail'})

      await runCommand(proxyCmd, ['testAccountName'])

      expect(openStub.called).to.equal(true)
      expect(openStub.calledWith('https://dashboard.heroku.com')).to.equal(true)
    })
  })

  describe('when the sso flag is set', function () {
    it('should log the user in using the sso method', async function () {
      process.env.HEROKU_API_KEY = 'testHerokuAPIKey'
      api.get('/account')
        .reply(200, {email: 'testEmail'})

      await runCommand(Cmd, ['testAccountName', '--sso'])

      expect(loginStub.called).to.equal(true)
      expect(loginStub.calledWith({method: 'sso', expiresIn: undefined, browser: undefined})).to.equal(true)
    })
  })

  it('should call the accounts.add function with the account name, user email, and auth token', async function () {
    process.env.HEROKU_API_KEY = 'testHerokuAPIKey'
    api.get('/account')
      .reply(200, {email: 'testEmail'})

    await runCommand(Cmd, ['testAccountName', '--sso'])
    expect(addStub.calledOnce).to.equal(true)
    expect(addStub.args[0][0]).to.equal('testAccountName')
    expect(addStub.args[0][1]).to.equal('testEmail')
    expect(addStub.args[0][2]).to.equal('testHerokuAPIKey')
  })

  it('should set a token expiration if the --expires-in flag is set', async function () {
    process.env.HEROKU_API_KEY = 'testHerokuAPIKey'
    api.get('/account')
      .reply(200, {email: 'testEmail'})

    await runCommand(Cmd, ['testAccountName', '--sso', '--expires-in', '3600'])

    expect(loginStub.called).to.equal(true)
    expect(loginStub.calledWith({method: 'sso', expiresIn: 3600, browser: undefined})).to.equal(true)
  })

  it('should log the user in with the selected browser when the --browser flag is set', async function () {
    process.env.HEROKU_API_KEY = 'testHerokuAPIKey'
    api.get('/account')
      .reply(200, {email: 'testEmail'})

    await runCommand(Cmd, ['testAccountName', '--browser', 'chrome'])

    expect(loginStub.called).to.equal(true)
    expect(loginStub.calledWith({method: 'browser', expiresIn: undefined, browser: 'chrome'})).to.equal(true)
  })

  it('should prompt the user to log in if the user does not have an auth token', async function () {
    process.env.HEROKU_API_KEY = ''
    api.get('/account')
      .reply(200, {email: 'testEmail'})

    await runCommand(Cmd, ['testAccountName'])
      .catch(error =>  {
        expect(error.message).to.equal('You must be logged in to run this command.')
      })
  })

  it('should prompt the user to log in if the user does not have an email', async function () {
    process.env.HEROKU_API_KEY = 'testHerokuAPIKey'
    api.get('/account')
      .reply(200, {})

    await runCommand(Cmd, ['testAccountName'])
      .catch(error =>  {
        expect(error.message).to.equal('You must be logged in to run this command.')
      })
  })
})
