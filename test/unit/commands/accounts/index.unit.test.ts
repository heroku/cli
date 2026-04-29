import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'

import Cmd from '../../../../src/commands/accounts/index.js'
import AccountsModule from '../../../../src/lib/accounts/accounts.js'

describe('accounts', function () {
  let currentStub: SinonStub
  let listStub: SinonStub

  beforeEach(function () {
    currentStub = stub(AccountsModule, 'current')
    listStub = stub(AccountsModule, 'list')
  })

  afterEach(function () {
    restore()
  })

  it('should print a list of added accounts with the current account highlighted if accounts are found', async function () {
    currentStub.resolves('test-account')
    listStub.returns([{name: 'test-account'}, {name: 'test-account-2'}])
    const {stdout} = await runCommand(Cmd, [])
    expect(stdout).to.equal('* test-account\n  test-account-2\n')
  })

  it('should print an error message if no accounts are found', async function () {
    listStub.returns([])
    await runCommand(Cmd, [])
      .catch((error: Error) => {
        expect(error.message).to.contain('You don\'t have any accounts in your cache.')
      })
  })
})
