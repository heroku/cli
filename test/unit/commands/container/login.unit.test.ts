import {APIClient} from '@heroku-cli/command'
import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {createSandbox, SinonSandbox} from 'sinon'

import Cmd from '../../../../src/commands/container/login.js'
import {DockerHelper} from '../../../../src/lib/container/docker-helper.js'

describe('container:login', function () {
  let sandbox: SinonSandbox

  beforeEach(function () {
    sandbox = createSandbox()
    sandbox.stub(APIClient.prototype, 'auth').get(() => 'heroku_token')
  })

  afterEach(function () {
    return sandbox.restore()
  })

  it('logs to the docker registry', async function () {
    const version = sandbox.stub(DockerHelper.prototype, 'version').resolves([19, 12])
    const login = sandbox.stub(DockerHelper.prototype, 'cmd')
      .withArgs('docker', ['login', '--username=_', '--password-stdin', 'registry.heroku.com'], {input: 'heroku_token'})

    const {stderr, stdout} = await runCommand(Cmd)

    expect(stdout).to.equal('')
    expect(stderr).to.equal('')
    sandbox.assert.calledOnce(version)
    sandbox.assert.calledOnce(login)
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
      const version = sandbox.stub(DockerHelper.prototype, 'version').resolves([19, 12])
      const login = sandbox.stub(DockerHelper.prototype, 'cmd')
        .withArgs('docker', ['login', '--username=_', '--password-stdin', 'registry.heroku.com'], {input: 'heroku_token'})

      const {stderr} = await runCommand(Cmd)

      expect(stderr).to.contain("Invalid HEROKU_HOST 'attacker.com'")
      sandbox.assert.calledOnce(version)
      sandbox.assert.calledOnce(login)
    })
  })

  it('logs to the docker registry with an old version', async function () {
    const version = sandbox.stub(DockerHelper.prototype, 'version').returns(new Promise(function (resolve) {
      resolve([17, 0])
    }))

    const login = sandbox.stub(DockerHelper.prototype, 'cmd')
      .withArgs('docker', ['login', '--username=_', '--password=heroku_token', 'registry.heroku.com'])

    const {stderr, stdout} = await runCommand(Cmd)

    expect(stdout).to.equal('')
    expect(stderr).to.equal('')
    sandbox.assert.calledOnce(version)
    sandbox.assert.calledOnce(login)
  })
})
