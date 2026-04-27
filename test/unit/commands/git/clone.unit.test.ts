import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'

import {GitClone as Clone} from '../../../../src/commands/git/clone.js'
import Git from '../../../../src/lib/git/git.js'
import {runCommand} from '../../../helpers/run-command.js'

describe('git:clone', function () {
  let api: nock.Scope
  let configureCredentialHelperStub: sinon.SinonStub
  let spawnStub: sinon.SinonStub

  beforeEach(function () {
    api = nock('https://api.heroku.com')

    configureCredentialHelperStub = sinon.stub(Git.prototype, 'configureCredentialHelper').resolves()
    spawnStub = sinon.stub(Git.prototype, 'spawn').resolves()
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()

    configureCredentialHelperStub.restore()
    spawnStub.restore()
  })

  it('errors if no app given', async function () {
    const {error} = await runCommand(Clone, [])

    expect(error?.message).to.contain('Missing required flag app')
  })

  it('configures git credential helper after cloning', async function () {
    api
      .get('/apps/test-app')
      .reply(200, {
        name: 'test-app',
      })

    await runCommand(Clone, ['-a', 'test-app'])

    expect(configureCredentialHelperStub.calledOnce).to.be.true
  })
})
