import {stdout, stderr} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/container/logout'
import runCommand from '../../../helpers/runCommand'
import {expect} from 'chai'
import * as sinon from 'sinon'
import * as DockerHelper from '../../../../src/lib/container/docker_helper'

const sandbox = sinon.createSandbox()

describe('container logout', () => {
  afterEach(() => sandbox.restore())

  it('logs out of the docker registry', async function () {
    const logout = sandbox.stub(DockerHelper, 'cmd')
      .withArgs('docker', ['logout', 'registry.heroku.com'])

    await runCommand(Cmd)

    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal('')
    sandbox.assert.calledOnce(logout)
  })
})
