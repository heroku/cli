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
    setStub = stub(AccountsModule, 'set').resolves()
  })

  afterEach(function () {
    restore()
  })

  it('calls set with the account name and dataDir when matched by name', async function () {
    listStub.resolves([{name: 'test-account', username: 'user1'}, {name: 'test-account-2', username: 'user2'}])
    await runCommand(Cmd, ['test-account-2'])
    expect(setStub.calledOnce).to.be.true
    expect(setStub.firstCall.args[0]).to.deep.equal({name: 'test-account-2', username: 'user2'})
    expect(setStub.firstCall.args[1].toLowerCase()).to.contain('local')
    expect(setStub.firstCall.args[1]).to.contain('heroku')
  })

  it('calls set with the account name and dataDir when matched by username', async function () {
    listStub.resolves([{username: 'user1@example.com'}, {username: 'user2@example.com'}])
    await runCommand(Cmd, ['user1@example.com'])
    expect(setStub.calledOnce).to.be.true
    expect(setStub.firstCall.args[0]).to.deep.equal({username: 'user1@example.com'})
    expect(setStub.firstCall.args[1].toLowerCase()).to.contain('local')
    expect(setStub.firstCall.args[1]).to.contain('heroku')
  })

  it('returns an error if the account is not in the list', async function () {
    listStub.resolves([{name: 'test-account', username: 'user1'}, {name: 'test-account-2', username: 'user2'}])

    const {error} = await runCommand(Cmd, ['test-account-3'])
    expect(error?.message).to.contain('test-account-3 doesn\'t exist in your accounts cache or system keychain.')
  })
})
