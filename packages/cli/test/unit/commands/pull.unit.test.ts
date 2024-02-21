import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../src/commands/container/pull'
import runCommand from '../../helpers/runCommand'
import * as sinon from 'sinon'
import {expect} from 'chai'
import * as DockerHelper from '../../../src/lib/container/docker_helper'

describe('container pull', () => {
  let sandbox: sinon.SinonSandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })
  afterEach(() => sandbox.restore())

  it('requires a process type', async () => {
    const exitStub = sandbox.stub(process, 'exit')
    await runCommand(Cmd, [
      '--app',
      'testapp',
    ])
    expect(stderr.output).to.contain('Requires one or more process types')
    expect(stdout.output, 'to be empty')
    expect(exitStub.calledWith(1)).to.equal(true)
  })

  it('pulls from the docker registry', async () => {
    const pull = sandbox.stub(DockerHelper, 'pullImage')
      .withArgs('registry.heroku.com/testapp/web')
    await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ])
    expect(stderr.output, 'to be empty')
    expect(stdout.output).to.contain('Pulling web as registry.heroku.com/testapp/web')
    sandbox.assert.calledOnce(pull)
  })
})
