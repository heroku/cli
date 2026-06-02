import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import sinon from 'sinon'

import Logout from '../../../../src/commands/auth/logout.js'
import AccountsModule from '../../../../src/lib/accounts/accounts.js'
import Git from '../../../../src/lib/git/git.js'

describe('auth:logout', function () {
  let eraseCredentialsStub: sinon.SinonStub
  let removeCredentialHelperStub: sinon.SinonStub
  let currentNetrcStub: sinon.SinonStub
  let removeNetrcStub: sinon.SinonStub

  beforeEach(function () {
    eraseCredentialsStub = sinon.stub(Git.prototype, 'eraseCredentials').resolves()
    removeCredentialHelperStub = sinon.stub(Git.prototype, 'removeCredentialHelper').resolves()
    currentNetrcStub = sinon.stub(AccountsModule, 'currentNetrc').resolves(null)
    removeNetrcStub = sinon.stub(AccountsModule, 'removeNetrc')
  })

  afterEach(function () {
    sinon.restore()
  })

  it('shows cli logging user out', async function () {
    const {stderr} = await runCommand(Logout, [])
    expect(stderr).to.equal('Logging out... done\n')
  })

  it('removes git credential helper on logout', async function () {
    await runCommand(Logout, [])

    expect(removeCredentialHelperStub.calledOnce).to.be.true
  })

  it('erases stale git credentials on logout', async function () {
    await runCommand(Logout, [])

    expect(eraseCredentialsStub.calledOnce).to.be.true
  })

  it('does not fail logout if git operations fail', async function () {
    eraseCredentialsStub.rejects(new Error('Git not found'))

    const {error} = await runCommand(Logout, [])

    expect(error).to.be.undefined
  })

  it('checks for cached netrc account', async function () {
    await runCommand(Logout, [])

    expect(currentNetrcStub.calledOnce).to.be.true
  })

  it('removes cached netrc account when present', async function () {
    currentNetrcStub.resolves('my-account')

    await runCommand(Logout, [])

    expect(removeNetrcStub.calledOnce).to.be.true
    expect(removeNetrcStub.firstCall.args[0]).to.equal('my-account')
  })

  it('does not remove account when no cached netrc account', async function () {
    currentNetrcStub.resolves(null)

    await runCommand(Logout, [])

    expect(removeNetrcStub.called).to.be.false
  })
})
