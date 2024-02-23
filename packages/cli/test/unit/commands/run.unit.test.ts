import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../src/commands/container/run'
import runCommand from '../../helpers/runCommand'
import * as sinon from 'sinon'
import {expect} from 'chai'
import * as DockerHelper from '../../../src/lib/container/docker_helper'
import expectOutput from '../../helpers/utils/expectOutput'

describe('container run', () => {
  let sandbox: sinon.SinonSandbox

  beforeEach(() => {
    process.env.HEROKU_API_KEY = 'heroku_token'
    sandbox = sinon.createSandbox()
  })
  afterEach(() => sandbox.restore())

  it('requires a process type', async () => {
    await runCommand(Cmd, [
      '--app',
      'testapp',
    ]).catch((error: any) => {
      expect(error.message).to.contain('Requires one process types')
      expect(stdout.output, 'to be empty')
    })
  })
  it('runs a container', async () => {
    const dockerfiles = sandbox.stub(DockerHelper, 'getDockerfiles')
      .returns(['/path/to/Dockerfile'])
    const run = sandbox.stub(DockerHelper, 'runImage')
      .withArgs('registry.heroku.com/testapp/web', [], 5000)
    await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ])
    expectOutput(stdout.output, 'Running registry.heroku.com/testapp/web')
    expectOutput(stderr.output, '')
    sandbox.assert.calledOnce(dockerfiles)
    sandbox.assert.calledOnce(run)
  })
  it('runs a container with a command', async () => {
    const dockerfiles = sandbox.stub(DockerHelper, 'getDockerfiles')
      .returns(['/path/to/Dockerfile'])
    const run = sandbox.stub(DockerHelper, 'runImage')
      .withArgs('registry.heroku.com/testapp/web', ['bash'], 5000)
    await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
      'bash',
    ])
    expectOutput(stdout.output, 'Running \'bash\' on registry.heroku.com/testapp/web')
    expectOutput(stderr.output, '')
    sandbox.assert.calledOnce(dockerfiles)
    sandbox.assert.calledOnce(run)
  })
  it('requires a known dockerfile', async () => {
    const dockerfiles = sandbox.stub(DockerHelper, 'getDockerfiles')
      .returns([])
    await runCommand(Cmd, [
      '--app',
      'testapp',
      'worker',
    ]).catch((error: any) => {
      expect(error.message).to.contain('No images to run')
      expect(stdout.output, 'to be empty')
      sandbox.assert.calledOnce(dockerfiles)
    })
  })
})
