import {stdout, stderr} from 'stdout-stderr'
// import Cmd from '../../../../src/commands/container/logout.js'
import runCommand from '../../../helpers/runCommand.js'
import {expect} from 'chai'
import sinon from 'sinon'
import {DockerHelper} from '../../../../src/lib/container/docker_helper.js'

/*
describe('container logout', function () {
  let sandbox: sinon.SinonSandbox

  beforeEach(function () {
    sandbox = sinon.createSandbox()
  })

  afterEach(function () {
    return sandbox.restore()
  })

  it('logs out of the docker registry', async function () {
    const logout = sandbox.stub(DockerHelper.prototype, 'cmd')
      .withArgs('docker', ['logout', 'registry.heroku.com'])

    await runCommand(Cmd)

    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal('')
    sandbox.assert.calledOnce(logout)
  })
})

*/
