import {expect} from 'chai'
import runCommand from '../../../helpers/runCommand.js'
import nock from 'nock'
import sinon from 'sinon'
import Cmd from '../../../../src/commands/accounts/add.js'
import AccountsModule from '../../../../src/lib/accounts/accounts.js'
import {stubWithoutKeychain, stubWithKeychain} from '../../../helpers/stubs/credential-manager.js'

describe('accounts:add', function () {
  let api: nock.Scope
  let addStub: sinon.SinonStub
  let listStub: sinon.SinonStub

  beforeEach(function () {
    listStub = sinon.stub(AccountsModule, 'list').returns([])
    addStub = sinon.stub(AccountsModule, 'add')
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    delete process.env.HEROKU_API_KEY
    sinon.restore()
    api.done()
    nock.cleanAll()
  })

  describe('when the account name already exists', function () {
    it('errors and does not call accounts.add', async function () {
      const existingName = 'existing-account'

      listStub.returns([{name: existingName}])

      try {
        await runCommand(Cmd, [existingName])
        expect.fail('expected command to error')
      } catch (error) {
        expect((error as Error).message).to.equal(`${existingName} already exists`)
      }

      expect(listStub.calledOnce).to.equal(true)
      expect(addStub.called).to.equal(false)
    })
  })

  describe('when the user is logged in', function () {
    it('should call the accounts.add function with the account name, user email, and auth token when credential store is unavailable', async function () {
      let {restore} = stubWithoutKeychain()

      process.env.HEROKU_API_KEY = 'testHerokuAPIKey'
      api.get('/account')
        .reply(200, {email: 'testEmail'})

      await runCommand(Cmd, ['testAccountName'])
      expect(addStub.calledOnce).to.equal(true)
      expect(addStub.args[0][0]).to.equal('testAccountName')
      expect(addStub.args[0][1]).to.equal('testEmail')
      expect(addStub.args[0][2]).to.equal('testHerokuAPIKey')

      restore()
    })

    it('should call the accounts.add function with the account name and user email when credential store is available', async function () {
      let {restore} = stubWithKeychain()

      process.env.HEROKU_API_KEY = 'testHerokuAPIKey'
      api.get('/account')
        .reply(200, {email: 'testEmail'})

      await runCommand(Cmd, ['testAccountName'])
      expect(addStub.calledOnce).to.equal(true)
      expect(addStub.args[0][0]).to.equal('testAccountName')
      expect(addStub.args[0][1]).to.equal('testEmail')
      expect(addStub.args[0][2]).to.be.undefined

      restore()
    })

    it('should prompt the user to log in if the user does not have an auth token', async function () {
      process.env.HEROKU_API_KEY = ''
      api.get('/account')
        .reply(200, {email: 'testEmail'})

      try {
        await runCommand(Cmd, ['testAccountName'])
        expect.fail('expected command to error')
      } catch (error) {
        expect((error as Error).message).to.equal('You must be logged in to run this command.')
      }
    })

    it('should prompt the user to log in if the user does not have an email', async function () {
      process.env.HEROKU_API_KEY = 'testHerokuAPIKey'
      api.get('/account')
        .reply(200, {})

      try {
        await runCommand(Cmd, ['testAccountName'])
        expect.fail('expected command to error')
      } catch (error) {
        expect((error as Error).message).to.equal('You must be logged in to run this command.')
      }
    })
  })
})
