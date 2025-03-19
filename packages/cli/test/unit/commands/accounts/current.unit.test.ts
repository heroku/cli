import {expect} from 'chai'
import runCommand from '../../../helpers/runCommand'
import * as sinon from 'sinon'
import Cmd from '../../../../src/commands/accounts/current'
import * as accounts from '../../../../src/lib/accounts/accounts'
import {stdout} from 'stdout-stderr'

describe('accounts:current', function () {
  let currentStub: sinon.SinonStub

  beforeEach(function () {
    currentStub = sinon.stub(accounts, 'current')
  })

  afterEach(function () {
    sinon.restore()
  })

  it('should print the name of the current account if an account is found', async function () {
    currentStub.returns('test-account')
    await runCommand(Cmd, [])
    expect(stdout.output).to.contain('test-account')
  })

  it('should print an error message if no account is found', async function () {
    currentStub.returns(null)
    await runCommand(Cmd, [])
      .catch((error: Error) => {
        expect(error.message).to.contain('No account is currently set.')
      })
  })
})
