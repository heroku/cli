import {runCommand} from '@heroku-cli/test-utils'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {Errors} from '@oclif/core'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd from '../../../../src/commands/container/push.js'
import {DockerHelper} from '../../../../src/lib/container/docker-helper.js'

type FakePlatform = {
  app: {info: sinon.SinonStub}
}

function buildFakePlatform(sandbox: sinon.SinonSandbox): FakePlatform {
  return {
    app: {info: sandbox.stub()},
  }
}

describe('container push', function () {
  let fakePlatform: FakePlatform
  let sandbox: sinon.SinonSandbox

  beforeEach(function () {
    sandbox = sinon.createSandbox()
    fakePlatform = buildFakePlatform(sandbox)
    sandbox.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sandbox.restore()
  })

  context('when HEROKU_HOST is set to an invalid domain', function () {
    let originalHost: string | undefined

    beforeEach(function () {
      originalHost = process.env.HEROKU_HOST
      process.env.HEROKU_HOST = 'attacker.com'
      fakePlatform.app.info.resolves({name: 'testapp', stack: {name: 'container'}})
    })

    afterEach(function () {
      if (originalHost === undefined) {
        delete process.env.HEROKU_HOST
      } else {
        process.env.HEROKU_HOST = originalHost
      }
    })

    it('rejects invalid HEROKU_HOST and uses default registry', async function () {
      const dockerfiles = sandbox.stub(DockerHelper.prototype, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      const build = sandbox.stub(DockerHelper.prototype, 'buildImage')
      const push = sandbox.stub(DockerHelper.prototype, 'pushImage')
        .withArgs('registry.heroku.com/testapp/web')

      const {stderr} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])

      expect(stderr).to.contain("Invalid HEROKU_HOST 'attacker.com'")
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledOnce(build)
      sandbox.assert.calledOnce(push)
    })
  })

  context('when the app stack is not "container"', function () {
    beforeEach(function () {
      fakePlatform.app.info.resolves({name: 'testapp', stack: {name: 'heroku-24'}})
    })

    it('exits', async function () {
      const {error} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])
      const {message, oclif} = error as unknown as Errors.CLIError
      expect(message).to.equal(`This command is for Docker apps only. Switch stacks by running ${color.code('heroku stack:set container')}. Or, to deploy ${color.app('testapp')} with ${color.name('heroku-24')}, run ${color.code('git push heroku main')} instead.`)
      expect(oclif.exit).to.equal(1)
    })
  })

  context('when the app build_stack is container', function () {
    beforeEach(function () {
      fakePlatform.app.info.resolves({build_stack: {name: 'container'}, name: 'testapp', stack: {name: 'heroku-24'}})
    })

    it('allows push to the docker registry', async function () {
      const dockerfiles = sandbox.stub(DockerHelper.prototype, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      const build = sandbox.stub(DockerHelper.prototype, 'buildImage')
      const push = sandbox.stub(DockerHelper.prototype, 'pushImage')
        .withArgs('registry.heroku.com/testapp/web')

      const {stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])

      expect(stdout).to.contain('Building web (/path/to/Dockerfile)')
      expect(stdout).to.contain('Pushing web (/path/to/Dockerfile)')
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledOnce(build)
      expect(build.getCall(0).args[0].dockerfile).to.equal('/path/to/Dockerfile')
      expect(build.getCall(0).args[0].resource).to.equal('registry.heroku.com/testapp/web')
      sandbox.assert.calledOnce(push)
    })
  })

  context('when the app is a container app', function () {
    beforeEach(function () {
      fakePlatform.app.info.resolves({name: 'testapp', stack: {name: 'container'}})
    })

    it('gets a build error', async function () {
      const dockerfiles = sandbox.stub(DockerHelper.prototype, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      const build = sandbox.stub(DockerHelper.prototype, 'buildImage')
        .throws()

      const {error, stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])
      const {message, oclif} = error as unknown as Errors.CLIError
      expect(message).to.contain('docker build exited with Error: Error')
      expect(oclif.exit).to.equal(1)

      expect(stdout).to.contain('Building web (/path/to/Dockerfile)')
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledOnce(build)
    })

    it('gets a push error', async function () {
      const dockerfiles = sandbox.stub(DockerHelper.prototype, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      const build = sandbox.stub(DockerHelper.prototype, 'buildImage')
      const push = sandbox.stub(DockerHelper.prototype, 'pushImage')
        .throws()

      const {error, stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])
      const {message, oclif} = error as unknown as Errors.CLIError
      expect(message).to.contain('docker push exited with Error: Error')
      expect(oclif.exit).to.equal(1)

      expect(stdout).to.contain('Building web (/path/to/Dockerfile)')
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledOnce(build)
      sandbox.assert.calledOnce(push)
    })

    it('pushes to the docker registry', async function () {
      const dockerfiles = sandbox.stub(DockerHelper.prototype, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      const build = sandbox.stub(DockerHelper.prototype, 'buildImage')
      const push = sandbox.stub(DockerHelper.prototype, 'pushImage')
        .withArgs('registry.heroku.com/testapp/web')

      const {stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])

      expect(stdout).to.contain('Building web (/path/to/Dockerfile)')
      expect(stdout).to.contain('Pushing web (/path/to/Dockerfile)')
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledOnce(build)
      expect(build.getCall(0).args[0].dockerfile).to.equal('/path/to/Dockerfile')
      expect(build.getCall(0).args[0].resource).to.equal('registry.heroku.com/testapp/web')
      sandbox.assert.calledOnce(push)
    })

    it('pushes the standard dockerfile to non-web', async function () {
      const dockerfiles = sandbox.stub(DockerHelper.prototype, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      const build = sandbox.stub(DockerHelper.prototype, 'buildImage')
      const push = sandbox.stub(DockerHelper.prototype, 'pushImage')
        .withArgs('registry.heroku.com/testapp/worker')

      const {stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'worker',
      ])

      expect(stdout).to.contain('Building worker (/path/to/Dockerfile)')
      expect(stdout).to.contain('Pushing worker (/path/to/Dockerfile)')
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledOnce(build)
      expect(build.getCall(0).args[0].dockerfile).to.equal('/path/to/Dockerfile')
      expect(build.getCall(0).args[0].resource).to.equal('registry.heroku.com/testapp/worker')
      sandbox.assert.calledOnce(push)
    })

    it('pushes specified dockerfiles recursively', async function () {
      const dockerfiles = sandbox.stub(DockerHelper.prototype, 'getDockerfiles')
        .returns(['/path/to/Dockerfile.web', '/path/to/Dockerfile.worker'])
      const build = sandbox.stub(DockerHelper.prototype, 'buildImage')
      const push = sandbox.stub(DockerHelper.prototype, 'pushImage')
      push.withArgs('registry.heroku.com/testapp/web')
      push.withArgs('registry.heroku.com/testapp/worker')

      const {stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        '--recursive',
        'web',
        'worker',
      ])

      expect(stdout).to.contain('Building web (/path/to/Dockerfile.web)')
      expect(stdout).to.contain('Building worker (/path/to/Dockerfile.worker)')
      expect(stdout).to.contain('Pushing web (/path/to/Dockerfile.web)')
      expect(stdout).to.contain('Pushing worker (/path/to/Dockerfile.worker)')
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledTwice(build)
      expect(build.getCall(0).args[0].dockerfile).to.equal('/path/to/Dockerfile.web')
      expect(build.getCall(1).args[0].dockerfile).to.equal('/path/to/Dockerfile.worker')
      sandbox.assert.calledTwice(push)
    })

    it('warns when a specified Dockerfile is missing', async function () {
      const dockerfiles = sandbox.stub(DockerHelper.prototype, 'getDockerfiles')
        .returns(['/path/to/Dockerfile.web'])
      const build = sandbox.stub(DockerHelper.prototype, 'buildImage')
      build.withArgs({
        buildArgs: [],
        dockerfile: '/path/to/Dockerfile.web',
        resource: 'registry.heroku.com/testapp/web',
      })
      const push = sandbox.stub(DockerHelper.prototype, 'pushImage')
      push.withArgs('registry.heroku.com/testapp/web')
      push.withArgs('registry.heroku.com/testapp/worker')

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        '--recursive',
        'web',
        'worker',
      ])

      expect(stdout).to.contain('Building web (/path/to/Dockerfile.web)')
      expect(stdout).to.contain('Pushing web (/path/to/Dockerfile.web)')
      expect(stderr).to.contain('Dockerfile.worker not found')
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledOnce(build)
      sandbox.assert.calledOnce(push)
    })

    it('pushes all dockerfiles recursively when process types are not specified', async function () {
      const dockerfiles = sandbox.stub(DockerHelper.prototype, 'getDockerfiles')
        .returns(['/path/to/Dockerfile.web', '/path/to/Dockerfile.worker'])
      const build = sandbox.stub(DockerHelper.prototype, 'buildImage')
      const push = sandbox.stub(DockerHelper.prototype, 'pushImage')
      push.withArgs('registry.heroku.com/testapp/web')
      push.withArgs('registry.heroku.com/testapp/worker')

      const {stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        '--recursive',
      ])

      expect(stdout).to.contain('Building web (/path/to/Dockerfile.web)')
      expect(stdout).to.contain('Building worker (/path/to/Dockerfile.worker)')
      expect(stdout).to.contain('Pushing web (/path/to/Dockerfile.web)')
      expect(stdout).to.contain('Pushing worker (/path/to/Dockerfile.worker)')
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledTwice(build)
      expect(build.getCall(0).args[0].dockerfile).to.equal('/path/to/Dockerfile.web')
      expect(build.getCall(1).args[0].dockerfile).to.equal('/path/to/Dockerfile.worker')
      sandbox.assert.calledTwice(push)
    })

    it('builds with custom context path and pushes to the docker registry', async function () {
      const dockerfiles = sandbox.stub(DockerHelper.prototype, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      const build = sandbox.stub(DockerHelper.prototype, 'buildImage')
      const push = sandbox.stub(DockerHelper.prototype, 'pushImage')
        .withArgs('registry.heroku.com/testapp/web')

      const {stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        '--context-path',
        '/custom/context/path',
        'web',
      ])

      const buildCallArgs = build.getCall(0).args[0]

      expect(stdout).to.contain('Building web (/path/to/Dockerfile)')
      expect(stdout).to.contain('Pushing web (/path/to/Dockerfile)')
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledOnce(build)
      expect(buildCallArgs.dockerfile).to.equal('/path/to/Dockerfile')
      expect(buildCallArgs.resource).to.equal('registry.heroku.com/testapp/web')
      expect(buildCallArgs.path).to.equal('/custom/context/path')
      sandbox.assert.calledOnce(push)
    })

    it('does not find an image to push', async function () {
      const dockerfiles = sandbox.stub(DockerHelper.prototype, 'getDockerfiles')
        .returns([])

      const {error, stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])
      const {message, oclif} = error as unknown as Errors.CLIError
      expect(message).to.contain('No images to push')
      expect(oclif.exit).to.equal(1)

      expect(stdout, 'to be empty')
      sandbox.assert.calledOnce(dockerfiles)
    })
  })

  it('requires a process type if we are not recursive', async function () {
    const {error, stdout} = await runCommand(Cmd, [
      '--app',
      'testapp',
    ])
    const {message, oclif} = error as unknown as Errors.CLIError
    expect(message).to.contain('Requires either --recursive or one or more process types')
    expect(oclif.exit).to.equal(1)
    expect(stdout).to.equal('')
  })

  it('rejects multiple process types if we are not recursive', async function () {
    const {error, stdout} = await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
      'worker',
    ])
    const {message, oclif} = error as unknown as Errors.CLIError
    expect(message).to.contain('Requires exactly one target process type, or --recursive option')
    expect(oclif.exit).to.equal(1)
    expect(stdout).to.equal('')
  })
})
