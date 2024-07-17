import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/container/run'
import runCommand from '../../../helpers/runCommand'
import * as sinon from 'sinon'
import {expect} from 'chai'
import * as DockerHelper from '../../../../src/lib/container/docker_helper'
import expectOutput from '../../../helpers/utils/expectOutput'
import {CLIError} from '@oclif/core/lib/errors'
import * as nock from 'nock'

describe('container run', function () {
  let api: nock.Scope
  let sandbox: sinon.SinonSandbox

  beforeEach(function () {
    api = nock('https://api.heroku.com:443')
    process.env.HEROKU_API_KEY = 'heroku_token'
    sandbox = sinon.createSandbox()
  })

  afterEach(function () {
    api.done()
    return sandbox.restore()
  })

  it('requires a process type', async function () {
    let error
    await runCommand(Cmd, [
      '--app',
      'testapp',
    ]).catch(error_ => {
      error = error_
    })
    const {message} = error as unknown as CLIError
    expect(message).to.contain('Requires one process type')
    expect(stdout.output).to.equal('')
  })

  it('exits when the app stack is not "container"', async function () {
    let error
    api
      .get('/apps/testapp')
      .reply(200, {name: 'testapp', stack: {name: 'heroku-24'}})
    await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ]).catch(error_ => {
      error = error_
    })
    const {message, oclif} = error as unknown as CLIError
    expect(message).to.equal('This command is for Docker apps only.')
    expect(oclif.exit).to.equal(1)
    expectOutput(stdout.output, '')
  })

  context('when the app is a container app', function () {
    beforeEach(function () {
      api
        .get('/apps/testapp')
        .reply(200, {name: 'testapp', stack: {name: 'container'}})
    })

    it('runs a container', async function () {
      const dockerfiles = sandbox.stub(DockerHelper, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      const run = sandbox.stub(DockerHelper, 'runImage')
        .withArgs('registry.heroku.com/testapp/web', '', 5000)
      await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])
      expectOutput(stdout.output, '=== Running registry.heroku.com/testapp/web')
      expectOutput(stderr.output, '')
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledOnce(run)
    })

    it('runs a container with a command', async function () {
      const dockerfiles = sandbox.stub(DockerHelper, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      const run = sandbox.stub(DockerHelper, 'runImage')
        .withArgs('registry.heroku.com/testapp/web', 'bash', 5000)
      await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
        'bash',
      ])
      expectOutput(stdout.output, '=== Running \'bash\' on registry.heroku.com/testapp/web')
      expectOutput(stderr.output, '')
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledOnce(run)
    })

    it('requires a known dockerfile', async function () {
      const dockerfiles = sandbox.stub(DockerHelper, 'getDockerfiles')
        .returns([])
      await runCommand(Cmd, [
        '--app',
        'testapp',
        'worker',
      ]).catch((error: any) => {
        expect(error.message).to.contain('No images to run')
        expect(stdout.output).to.equal('')
        sandbox.assert.calledOnce(dockerfiles)
      })
    })
  })
})
