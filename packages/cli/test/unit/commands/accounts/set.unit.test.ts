import {expect} from 'chai'
import runCommand from '../../../helpers/runCommand'
import * as sinon from 'sinon'
import Cmd from '../../../../src/commands/accounts/set'
import * as accounts from '../../../../src/lib/accounts/accounts'

describe('accounts:set', function () {
  let listStub: sinon.SinonStub
  let setStub: sinon.SinonStub

  beforeEach(function () {
    listStub = sinon.stub(accounts, 'list')
    setStub = sinon.stub(accounts, 'set')
  })

  afterEach(function () {
    sinon.restore()
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
        expect(error.message).to.contain('test-account-3 does not exist.')
      })
  })
})
