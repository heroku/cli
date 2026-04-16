import {runCommand} from '@heroku-cli/test-utils'
import {Errors} from '@oclif/core'
import {expect} from 'chai'
import nock from 'nock'
import * as sinon from 'sinon'

import Cmd from '../../../../src/commands/container/pull.js'
import {DockerHelper} from '../../../../src/lib/container/docker-helper.js'

describe('container pull', function () {
  let sandbox: sinon.SinonSandbox

  beforeEach(function () {
    sandbox = sinon.createSandbox()
  })

  afterEach(function () {
    nock.cleanAll()
    return sandbox.restore()
  })

  it('requires a process type', async function () {
    const {error, stdout} = await runCommand(Cmd, [
      '--app',
      'testapp',
    ])
    expect(error).to.exist
    expect(error!.message).to.contain('Requires one or more process types')
    expect(stdout).to.equal('')
  })

  it('exits when the app stack is not container', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp', stack: {name: 'heroku-24'}})
    const {error, stdout} = await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ])
    expect(error).to.exist
    const {message, oclif} = error as unknown as Errors.CLIError
    expect(message).to.equal('This command is for Docker apps only.')
    expect(oclif.exit).to.equal(1)

    expect(stdout).to.equal('')
    api.done()
  })

  it('pulls from the docker registry', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp', stack: {name: 'container'}})
    const pull = sandbox.stub(DockerHelper.prototype, 'pullImage')
      .withArgs('registry.heroku.com/testapp/web')
    const {stdout} = await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ])
    expect(stdout).to.contain('Pulling web as registry.heroku.com/testapp/web')
    sandbox.assert.calledOnce(pull)
    api.done()
  })
})
