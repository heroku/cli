import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {NotAContainerAppError} from '@heroku/sdk/extensions/platform'
import {Errors} from '@oclif/core'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd from '../../../../src/commands/container/pull.js'
import {DockerHelper} from '../../../../src/lib/container/docker-helper.js'

type FakePlatform = {
  container: {ensureContainerStack: sinon.SinonStub}
}

function buildFakePlatform(sandbox: sinon.SinonSandbox): FakePlatform {
  return {
    container: {ensureContainerStack: sandbox.stub()},
  }
}

describe('container pull', function () {
  let sandbox: sinon.SinonSandbox
  let fakePlatform: FakePlatform

  beforeEach(function () {
    sandbox = sinon.createSandbox()
    fakePlatform = buildFakePlatform(sandbox)
    sandbox.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sandbox.restore()
  })

  it('requires a process type', async function () {
    const {error, stdout} = await runCommand(Cmd, [
      '--app',
      'testapp',
    ])
    expect(error).to.exist
    expect(error!.message).to.contain('Requires one or more process types')
    expect(stdout).to.equal('')
  })

  it('exits when the app stack is not container', async function () {
    fakePlatform.container.ensureContainerStack.rejects(new NotAContainerAppError({
      build_stack: {name: 'heroku-24'},
      id: 'test-id',
      name: 'testapp',
      stack: {id: 'test-id', name: 'heroku-24'},
    }))
    const {error, stdout} = await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ])
    expect(error).to.exist
    const {message, oclif} = error as unknown as Errors.CLIError
    expect(message).to.equal('This command is for Docker apps only.')
    expect(oclif.exit).to.equal(1)

    expect(stdout).to.equal('')
  })

  it('pulls from the docker registry', async function () {
    fakePlatform.container.ensureContainerStack.resolves()
    const pull = sandbox.stub(DockerHelper.prototype, 'pullImage')
      .withArgs('registry.heroku.com/testapp/web')
    const {stdout} = await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ])
    expect(stdout).to.contain('Pulling web as registry.heroku.com/testapp/web')
    sandbox.assert.calledOnce(pull)
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
      fakePlatform.container.ensureContainerStack.resolves()
      const pull = sandbox.stub(DockerHelper.prototype, 'pullImage')
        .withArgs('registry.heroku.com/testapp/web')

      const {stderr} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])

      expect(stderr).to.contain("Invalid HEROKU_HOST 'attacker.com'")
      sandbox.assert.calledOnce(pull)
    })
  })
})
