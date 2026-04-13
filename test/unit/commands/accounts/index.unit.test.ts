import {expect} from 'chai'
import sinon from 'sinon'
import {stdout} from 'stdout-stderr'

import Cmd from '../../../../src/commands/accounts/index.js'
import AccountsModule from '../../../../src/lib/accounts/accounts.js'
import runCommand from '../../../helpers/legacy-run-command.js'

describe('accounts', function () {
  let currentStub: sinon.SinonStub
  let listStub: sinon.SinonStub

  beforeEach(function () {
    currentStub = sinon.stub(AccountsModule, 'current')
    listStub = sinon.stub(AccountsModule, 'list')
  })

  afterEach(function () {
    sinon.restore()
  })

  it('should print a list of added accounts with the current account highlighted if accounts are found', async function () {
    currentStub.resolves('test-account')
    listStub.returns([{name: 'test-account'}, {name: 'test-account-2'}])
    await runCommand(Cmd, [])
    expect(stdout.output).to.equal('* test-account\n  test-account-2\n')
  })

  it('should print an error message if no accounts are found', async function () {
    listStub.returns([])
    await runCommand(Cmd, [])
      .catch((error: Error) => {
        expect(error.message).to.contain('You don\'t have any accounts in your cache.')
      })
  })
})
