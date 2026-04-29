import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'

import {GitRemote as Remote} from '../../../../src/commands/git/remote.js'
import Git from '../../../../src/lib/git/git.js'
import {runCommand} from '../../../helpers/run-command.js'

describe('git:remote', function () {
  let api: nock.Scope
  let configureCredentialHelperStub: sinon.SinonStub
  let execStub: sinon.SinonStub

  beforeEach(function () {
    api = nock('https://api.heroku.com')

    configureCredentialHelperStub = sinon.stub(Git.prototype, 'configureCredentialHelper').resolves()
    execStub = sinon.stub(Git.prototype, 'exec').resolves('')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()

    configureCredentialHelperStub.restore()
    execStub.restore()
  })

  it('errors if no app given', async function () {
    const {error} = await runCommand(Remote, [])

    expect(error?.message).to.contain('Specify an app with --app')
  })

  it('configures git credential helper after adding remote', async function () {
    api
      .get('/apps/test-app')
      .reply(200, {
        name: 'test-app',
      })

    await runCommand(Remote, ['-a', 'test-app'])

    expect(configureCredentialHelperStub.calledOnce).to.be.true
  })
})
