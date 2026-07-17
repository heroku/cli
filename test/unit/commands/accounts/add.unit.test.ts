import {APIClient} from '@heroku-cli/command'
import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'

import Cmd from '../../../../src/commands/accounts/add.js'
import AccountsModule from '../../../../src/lib/accounts/accounts.js'

type FakePlatform = {
  account: {info: SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    account: {info: stub()},
  }
}

describe('accounts:add', function () {
  let fakePlatform: FakePlatform
  let addStub: SinonStub
  let listStub: SinonStub
  let originalApiKey: string | undefined

  beforeEach(function () {
    // Tests here rely on the stubbed APIClient for auth; HEROKU_API_KEY
    // from test/helpers/init.mjs would otherwise take precedence in APIClient
    // and defeat the stubs.
    originalApiKey = process.env.HEROKU_API_KEY
    delete process.env.HEROKU_API_KEY

    listStub = stub(AccountsModule, 'list').resolves([])
    addStub = stub(AccountsModule, 'add')
    fakePlatform = buildFakePlatform()
    stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
    stub(APIClient.prototype, 'auth').get(() => 'testHerokuAPIKey')
  })

  afterEach(function () {
    restore()
    if (originalApiKey !== undefined) process.env.HEROKU_API_KEY = originalApiKey
  })

  describe('when the user is logged in', function () {
    it('should call the accounts.add function with the account name and user email', async function () {
      fakePlatform.account.info.resolves({email: 'testEmail'})

      await runCommand(Cmd, ['testAccountName'])
      expect(addStub.calledOnce).to.equal(true)
      expect(addStub.args[0][0]).to.equal('testAccountName')
      expect(addStub.args[0][1]).to.equal('testEmail')
    })

    it('should not pass token to add() when credentialStore is active (keychain-mode)', async function () {
      const getStorageConfigStub = stub(AccountsModule, 'getStorageConfig')
      getStorageConfigStub.returns({credentialStore: 'keychain' as any, useNetrc: false})

      fakePlatform.account.info.resolves({email: 'testEmail'})

      await runCommand(Cmd, ['testAccountName'])

      expect(addStub.calledOnce).to.equal(true)
      expect(addStub.args[0][0]).to.equal('testAccountName')
      expect(addStub.args[0][1]).to.equal('testEmail')
      expect(addStub.args[0][2]).to.be.undefined
    })

    it('should pass token to add() when credentialStore is not active (netrc-mode)', async function () {
      const getStorageConfigStub = stub(AccountsModule, 'getStorageConfig')
      getStorageConfigStub.returns({credentialStore: null, useNetrc: true})

      fakePlatform.account.info.resolves({email: 'testEmail'})

      await runCommand(Cmd, ['testAccountName'])

      expect(addStub.calledOnce).to.equal(true)
      expect(addStub.args[0][0]).to.equal('testAccountName')
      expect(addStub.args[0][1]).to.equal('testEmail')
      expect(addStub.args[0][2]).to.equal('testHerokuAPIKey')
    })

    it('should error if the account name already exists', async function () {
      listStub.resolves([{name: 'testAccountName', username: 'testEmail'}])

      try {
        await runCommand(Cmd, ['testAccountName'])
      } catch (error: unknown) {
        expect((error as Error).message).to.contain('testAccountName already exists')
      }
    })

    it('should error if the email already has an alias', async function () {
      fakePlatform.account.info.resolves({email: 'testEmail'})

      listStub.resolves([{name: 'existingAlias', username: 'testEmail'}])

      try {
        await runCommand(Cmd, ['newAlias'])
      } catch (error: unknown) {
        expect((error as Error).message).to.contain('testEmail already has an alias: existingAlias')
      }
    })

    it('should error if the user is not logged in', async function () {
      fakePlatform.account.info.throws(new Error('Not logged in'))

      try {
        await runCommand(Cmd, ['testAccountName'])
      } catch (error: unknown) {
        expect((error as Error).message).to.contain('Not logged in')
        expect(addStub.called).to.equal(false)
      }
    })
  })
})
