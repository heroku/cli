import {expect} from 'chai'
import {APIClient} from '@heroku-cli/command'
import runCommand from '../../../helpers/runCommand.js'
import nock from 'nock'
import sinon from 'sinon'
import Cmd from '../../../../src/commands/accounts/add.js'
import AccountsModule from '../../../../src/lib/accounts/accounts.js'
import {stubCredentialManager} from '../../../helpers/credential-manager-stub.js'

describe('accounts:add', function () {
  let api: nock.Scope
  let addStub: sinon.SinonStub
  let listStub: sinon.SinonStub

  beforeEach(function () {
    listStub = sinon.stub(AccountsModule, 'list').resolves([])
    addStub = sinon.stub(AccountsModule, 'add')
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    sinon.restore()
    api.done()
    nock.cleanAll()
  })

  describe('when the user is logged in', function () {
    it('should call the accounts.add function with the account name, user email, and auth token', async function () {
      stubCredentialManager({
        getAuth: async () => ({account: 'testEmail', token: 'testHerokuAPIKey'}),
      })

      api.get('/account')
        .reply(200, {email: 'testEmail'})

      await runCommand(Cmd, ['testAccountName'])
      expect(addStub.calledOnce).to.equal(true)
      expect(addStub.args[0][0]).to.equal('testAccountName')
      expect(addStub.args[0][1]).to.equal('testEmail')
      expect(addStub.args[0][2]).to.equal('testHerokuAPIKey')
    })

    it('should prompt the user to log in if the user is not logged in', async function () {
      stubCredentialManager({
        getAuth: async () => ({account: undefined, token: undefined}),
      })

      const APIClientStub = sinon.stub(APIClient.prototype, 'login')
      APIClientStub.resolves()

      api.get('/account')
        .reply(401, {id: 'unauthorized', message: 'Unauthorized'})

      api.get('/account')
        .reply(200, {email: 'testEmail'})

      await runCommand(Cmd, ['testAccountName'])

      expect(APIClientStub.calledOnce).to.equal(true)
    })

    it('should error if the account name already exists', async function () {
      stubCredentialManager({
        getAuth: async () => ({account: 'testEmail', token: 'testHerokuAPIKey'}),
      })

      listStub.resolves([{name: 'testAccountName', username: 'testEmail'}])

      try {
        await runCommand(Cmd, ['testAccountName'])
      } catch (error: any) {
        expect((error as Error).message).to.contain('testAccountName already exists')
      }
    })
  })
})
