import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd from '../../../../src/commands/accounts/current.js'
import AccountsModule from '../../../../src/lib/accounts/accounts.js'

describe('accounts:current', function () {
  let currentStub: sinon.SinonStub

  beforeEach(function () {
    currentStub = sinon.stub(AccountsModule, 'current')
  })

  afterEach(function () {
    sinon.restore()
  })

  it('should print the name of the current account if an account is found', async function () {
    currentStub.returns('test-account')
    const {stdout} = await runCommand(Cmd, [])
    expect(stdout).to.contain('test-account')
  })

  it('should print an error message if no account is found', async function () {
    currentStub.returns(null)
    await runCommand(Cmd, [])
      .catch((error: Error) => {
        const expected = 'You haven\'t set an account. Run heroku accounts:add <account-name> to add an account to your cache or heroku accounts:set <account-name> to set the current account.'
        expect(ansis.strip(error.message)).to.equal(expected)
      })
  })
})
