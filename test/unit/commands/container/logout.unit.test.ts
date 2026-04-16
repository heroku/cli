import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import sinon from 'sinon'

import Cmd from '../../../../src/commands/container/logout.js'
import {DockerHelper} from '../../../../src/lib/container/docker-helper.js'

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

    const {stderr, stdout} = await runCommand(Cmd)

    expect(stdout).to.equal('')
    expect(stderr).to.equal('')
    sandbox.assert.calledOnce(logout)
  })
})
