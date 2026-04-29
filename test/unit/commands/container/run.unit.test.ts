import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {Errors} from '@oclif/core'
import {expect} from 'chai'
import nock from 'nock'
import {createSandbox, SinonSandbox} from 'sinon'

import Cmd from '../../../../src/commands/container/run.js'
import {DockerHelper} from '../../../../src/lib/container/docker-helper.js'

describe('container run', function () {
  let api: nock.Scope
  let sandbox: SinonSandbox

  beforeEach(function () {
    api = nock('https://api.heroku.com:443')
    process.env.HEROKU_API_KEY = 'heroku_token'
    sandbox = createSandbox()
  })

  afterEach(function () {
    api.done()
    return sandbox.restore()
  })

  it('requires a process type', async function () {
    const {error, stdout} = await runCommand(Cmd, [
      '--app',
      'testapp',
    ])
    const {message} = error as unknown as Errors.CLIError
    expect(message).to.contain('Requires one process type')
    expect(stdout).to.equal('')
  })

  it('exits when the app stack is not "container"', async function () {
    api
      .get('/apps/testapp')
      .reply(200, {name: 'testapp', stack: {name: 'heroku-24'}})
    const {error, stdout} = await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ])
    const {message, oclif} = error as unknown as Errors.CLIError
    expect(message).to.equal('This command is for Docker apps only.')
    expect(oclif.exit).to.equal(1)
    expectOutput(stdout, '')
  })

  context('when the app is a container app', function () {
    beforeEach(function () {
      api
        .get('/apps/testapp')
        .reply(200, {name: 'testapp', stack: {name: 'container'}})
    })

    it('runs a container', async function () {
      const dockerfiles = sandbox.stub(DockerHelper.prototype, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      const run = sandbox.stub(DockerHelper.prototype, 'runImage')
        .withArgs('registry.heroku.com/testapp/web', '', 5000)
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])
      expectOutput(stdout, '=== Running registry.heroku.com/testapp/web')
      expectOutput(stderr, '')
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledOnce(run)
    })

    it('runs a container with a command', async function () {
      const dockerfiles = sandbox.stub(DockerHelper.prototype, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      const run = sandbox.stub(DockerHelper.prototype, 'runImage')
        .withArgs('registry.heroku.com/testapp/web', 'bash', 5000)
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
        'bash',
      ])
      expectOutput(stdout, '=== Running \'bash\' on registry.heroku.com/testapp/web')
      expectOutput(stderr, '')
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledOnce(run)
    })

    it('requires a known dockerfile', async function () {
      const dockerfiles = sandbox.stub(DockerHelper.prototype, 'getDockerfiles')
        .returns([])
      const {error, stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'worker',
      ])
      expect(error!.message).to.contain('No images to run')
      expect(stdout).to.equal('')
      sandbox.assert.calledOnce(dockerfiles)
    })
  })
})
