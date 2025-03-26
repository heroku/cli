import {expect} from 'chai'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import * as sinon from 'sinon'
import Cmd from '../../../../src/commands/accounts/add'
import * as accounts from '../../../../src/lib/accounts/accounts'

describe('accounts:add', function () {
  let api: nock.Scope
  let addStub: sinon.SinonStub

  beforeEach(function () {
    sinon.stub(accounts, 'list').returns([])
    addStub = sinon.stub(accounts, 'add')
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    delete process.env.HEROKU_API_KEY
    sinon.restore()
    api.done()
    nock.cleanAll()
  })

  describe('when the user is logged in', function () {
    it('should call the accounts.add function with the account name, user email, and auth token', async function () {
      process.env.HEROKU_API_KEY = 'testHerokuAPIKey'
      api.get('/account')
        .reply(200, {email: 'testEmail'})

      await runCommand(Cmd, ['testAccountName'])
      expect(addStub.calledOnce).to.equal(true)
      expect(addStub.args[0][0]).to.equal('testAccountName')
      expect(addStub.args[0][1]).to.equal('testEmail')
      expect(addStub.args[0][2]).to.equal('testHerokuAPIKey')
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
})
