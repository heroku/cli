import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'

import Cmd from '../../../../src/commands/accounts/set.js'
import AccountsModule from '../../../../src/lib/accounts/accounts.js'

describe('accounts:set', function () {
  let listStub: SinonStub
  let setStub: SinonStub

  beforeEach(function () {
    listStub = stub(AccountsModule, 'list')
    setStub = stub(AccountsModule, 'set')
  })

  afterEach(function () {
    restore()
  })

  it('calls the set function with the account name when the account exists', async function () {
    listStub.returns([{name: 'test-account'}, {name: 'test-account-2'}])
    await runCommand(Cmd, ['test-account-2'])
    expect(setStub.calledWith('test-account-2'))
  })

  it('should return an error if the selected account name is not included in the account list', async function () {
    listStub.returns([{name: 'test-account'}, {name: 'test-account-2'}])
    await runCommand(Cmd, ['test-account-3'])
      .catch((error: Error) => {
        expect(error.message).to.contain('test-account-3 does not exist in your accounts cache.')
      })
  })
})
