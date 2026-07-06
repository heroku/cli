import {APIClient} from '@heroku-cli/command'
import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import {restore, SinonStub, stub} from 'sinon'

import Cmd from '../../../../src/commands/accounts/add.js'
import AccountsModule from '../../../../src/lib/accounts/accounts.js'
import {stubCredentialManager} from '../../../helpers/credential-manager-stub.js'

describe('accounts:add', function () {
  let api: nock.Scope
  let addStub: SinonStub
  let listStub: SinonStub
  let originalApiKey: string | undefined

  beforeEach(function () {
    // Tests here rely on the stubbed credential manager for auth; HEROKU_API_KEY
    // from test/helpers/init.mjs would otherwise take precedence in APIClient
    // and defeat the stubs.
    originalApiKey = process.env.HEROKU_API_KEY
    delete process.env.HEROKU_API_KEY

    listStub = stub(AccountsModule, 'list').resolves([])
    addStub = stub(AccountsModule, 'add')
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    restore()
    api.done()
    nock.cleanAll()
    if (originalApiKey !== undefined) process.env.HEROKU_API_KEY = originalApiKey
  })

  describe('when the user is logged in', function () {
    it('should call the accounts.add function with the account name and user email', async function () {
      stubCredentialManager({
        getAuth: async () => ({account: 'testEmail', token: 'testHerokuAPIKey'}),
      })

      api.get('/account')
        .reply(200, {email: 'testEmail'})

      await runCommand(Cmd, ['testAccountName'])
      expect(addStub.calledOnce).to.equal(true)
      expect(addStub.args[0][0]).to.equal('testAccountName')
      expect(addStub.args[0][1]).to.equal('testEmail')
    })

    it('should not pass token to add() when credentialStore is active (keychain-mode)', async function () {
      stubCredentialManager({
        getAuth: async () => ({account: 'testEmail', token: 'testHerokuAPIKey'}),
      })

      const getStorageConfigStub = stub(AccountsModule, 'getStorageConfig')
      getStorageConfigStub.returns({credentialStore: 'keychain' as any, useNetrc: false})

      api.get('/account')
        .reply(200, {email: 'testEmail'})

      await runCommand(Cmd, ['testAccountName'])

      expect(addStub.calledOnce).to.equal(true)
      expect(addStub.args[0][0]).to.equal('testAccountName')
      expect(addStub.args[0][1]).to.equal('testEmail')
      expect(addStub.args[0][2]).to.be.undefined
    })

    it('should pass token to add() when credentialStore is not active (netrc-mode)', async function () {
      stubCredentialManager({
        getAuth: async () => ({account: 'testEmail', token: 'testHerokuAPIKey'}),
      })

      const getStorageConfigStub = stub(AccountsModule, 'getStorageConfig')
      getStorageConfigStub.returns({credentialStore: null, useNetrc: true})

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

      const APIClientStub = stub(APIClient.prototype, 'login')
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
      } catch (error: unknown) {
        expect((error as Error).message).to.contain('testAccountName already exists')
      }
    })

    it('should error if the email already has an alias', async function () {
      stubCredentialManager({
        getAuth: async () => ({account: 'testEmail', token: 'testHerokuAPIKey'}),
      })

      api.get('/account')
        .reply(200, {email: 'testEmail'})

      listStub.resolves([{name: 'existingAlias', username: 'testEmail'}])

      try {
        await runCommand(Cmd, ['newAlias'])
      } catch (error: unknown) {
        expect((error as Error).message).to.contain('testEmail already has an alias: existingAlias')
      }
    })
  })
})
