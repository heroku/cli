import {expect} from 'chai'
import runCommand from '../../../helpers/runCommand.js'
import * as sinon from 'sinon'
import Cmd from '../../../../src/commands/accounts/remove.js'
import accountsModule from '../../../../src/lib/accounts/accounts.js'

describe('accounts:remove', function () {
  // let currentStub: sinon.SinonStub

  // beforeEach(function () {
  //   currentStub = sinon.stub(accountsModule, 'current')
  // })

  // afterEach(function () {
  //   sinon.restore()
  // })
  let currentStub: sinon.SinonStub
  let listStub: sinon.SinonStub
  let removeStub: sinon.SinonStub

  beforeEach(function () {
    currentStub = sinon.stub(accountsModule, 'current')
    listStub = sinon.stub(accountsModule, 'list')
    removeStub = sinon.stub(accountsModule, 'remove')
  })

  afterEach(function () {
    sinon.restore()
  })

  it('calls the remove function with the account name when the account exists and it is not the current account', async function () {
    currentStub.returns('test-account')
    listStub.returns([{name: 'test-account'}, {name: 'test-account-2'}])
    await runCommand(Cmd, ['test-account-2'])
    expect(removeStub.calledWith('test-account-2'))
  })

  it('should return an error if the selected account name is not included in the account list', async function () {
    currentStub.returns('test-account')
    listStub.returns([{name: 'test-account'}, {name: 'test-account-2'}])
    await runCommand(Cmd, ['test-account-3'])
      .catch((error: Error) => {
        expect(error.message).to.contain('test-account-3 doesn\'t exist in your accounts cache.')
      })
  })

  it('should return an error if the selected account name is the current account', async function () {
    currentStub.returns('test-account')
    listStub.returns([{name: 'test-account'}, {name: 'test-account-2'}])
    await runCommand(Cmd, ['test-account'])
      .catch((error: Error) => {
        expect(error.message).to.contain('test-account is the current account.')
      })
  })
})
