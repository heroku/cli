import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {createSandbox, SinonSandbox} from 'sinon'

import Cmd from '../../../../src/commands/container/logout.js'
import {DockerHelper} from '../../../../src/lib/container/docker-helper.js'

describe('container logout', function () {
  let sandbox: SinonSandbox

  beforeEach(function () {
    sandbox = createSandbox()
  })

  afterEach(function () {
    return sandbox.restore()
  })

  context('when HEROKU_HOST is set to an invalid domain', function () {
    let originalHost: string | undefined

    beforeEach(function () {
      originalHost = process.env.HEROKU_HOST
      process.env.HEROKU_HOST = 'attacker.com'
    })

    afterEach(function () {
      if (originalHost === undefined) {
        delete process.env.HEROKU_HOST
      } else {
        process.env.HEROKU_HOST = originalHost
      }
    })

    it('rejects invalid HEROKU_HOST and uses default registry', async function () {
      const logout = sandbox.stub(DockerHelper.prototype, 'cmd')
        .withArgs('docker', ['logout', 'registry.heroku.com'])

      const {stderr} = await runCommand(Cmd)

      expect(stderr).to.contain("Invalid HEROKU_HOST 'attacker.com'")
      sandbox.assert.calledOnce(logout)
    })
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
