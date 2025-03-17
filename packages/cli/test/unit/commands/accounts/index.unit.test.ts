import {expect} from 'chai'
import runCommand from '../../../helpers/runCommand'
import * as sinon from 'sinon'
import Cmd from '../../../../src/commands/accounts/index'
import * as accounts from '../../../../src/lib/accounts/accounts'
import {stdout} from 'stdout-stderr'

describe('accounts', function () {
  let currentStub: sinon.SinonStub
  let listStub: sinon.SinonStub

  beforeEach(function () {
    currentStub = sinon.stub(accounts, 'current')
    listStub = sinon.stub(accounts, 'list')
  })

  afterEach(function () {
    sinon.restore()
  })

  it('should print a list of added accounts with the current account highlighted if accounts are found', async function () {
    currentStub.returns('test-account')
    listStub.returns([{name: 'test-account'}, {name: 'test-account-2'}])
    await runCommand(Cmd, [])
    expect(stdout.output).to.equal('* test-account\n  test-account-2\n')
  })

  it('should print an error message if no accounts are found', async function () {
    listStub.returns([])
    await runCommand(Cmd, [])
      .catch((error: Error) => {
        expect(error.message).to.contain('No accounts')
      })
  })
})
