import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/container/pull'
import runCommand from '../../../helpers/runCommand'
import * as sinon from 'sinon'
import {expect} from 'chai'
import * as DockerHelper from '../../../../src/lib/container/docker_helper'
import * as nock from 'nock'
import {CLIError} from '@oclif/core/lib/errors'

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
    await runCommand(Cmd, [
      '--app',
      'testapp',
    ]).catch((error: any) => {
      expect(error.message).to.contain('Requires one or more process types')
    })
    expect(stdout.output).to.equal('')
  })

  it('exits when the app stack is not container', async function () {
    let error
    const api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp', stack: {name: 'heroku-24'}})
    await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ]).catch((error_: any) => {
      error = error_
    })
    const {message, oclif} = error as unknown as CLIError
    expect(message).to.equal('This command is for Docker apps only.')
    expect(oclif.exit).to.equal(1)

    expect(stdout.output).to.equal('')
    api.done()
  })

  it('pulls from the docker registry', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp', stack: {name: 'container'}})
    const pull = sandbox.stub(DockerHelper, 'pullImage')
      .withArgs('registry.heroku.com/testapp/web')
    await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ])
    expect(stdout.output).to.contain('Pulling web as registry.heroku.com/testapp/web')
    sandbox.assert.calledOnce(pull)
    api.done()
  })
})
