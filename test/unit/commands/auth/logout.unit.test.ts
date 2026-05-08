import {expect} from 'chai'
import sinon from 'sinon'

import Logout from '../../../../src/commands/auth/logout.js'
import Git from '../../../../src/lib/git/git.js'
import {runCommand} from '../../../helpers/run-command.js'

describe('auth:logout', function () {
  let eraseCredentialsStub: sinon.SinonStub
  let removeCredentialHelperStub: sinon.SinonStub

  beforeEach(function () {
    eraseCredentialsStub = sinon.stub(Git.prototype, 'eraseCredentials').resolves()
    removeCredentialHelperStub = sinon.stub(Git.prototype, 'removeCredentialHelper').resolves()
  })

  afterEach(function () {
    eraseCredentialsStub.restore()
    removeCredentialHelperStub.restore()
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
})
