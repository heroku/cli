import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/container/push'
import runCommand from '../../../helpers/runCommand'
import {expect} from 'chai'
import * as sinon from 'sinon'
import * as DockerHelper from '../../../../src/lib/container/docker_helper'
import * as nock from 'nock'
import {CLIError} from '@oclif/core/lib/errors'
import color from '@heroku-cli/color'

const sandbox = sinon.createSandbox()

describe('container push', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com:443')
    return nock.cleanAll()
  })

  afterEach(function () {
    api.done()
    return sandbox.restore()
  })

  context('when the app stack is not "container"', function () {
    beforeEach(function () {
      api
        .get('/apps/testapp')
        .reply(200, {name: 'testapp', stack: {name: 'heroku-24'}})
    })

    it('exits', async function () {
      let error
      await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ]).catch((error_: any) => {
        error = error_
      })
      const {message, oclif} = error as unknown as CLIError
      expect(message).to.equal(`This command is for Docker apps only. Switch stacks by running ${color.cmd('heroku stack:set container')}. Or, to deploy ${color.app('testapp')} with ${color.yellow('heroku-24')}, run ${color.cmd('git push heroku main')} instead.`)
      expect(oclif.exit).to.equal(1)
    })
  })

  context('when the app build_stack is container', function () {
    beforeEach(function () {
      api
        .get('/apps/testapp')
        .reply(200, {name: 'testapp', stack: {name: 'heroku-22'}, build_stack: {name: 'container'}})
    })

    it('allows push to the docker registry', async function () {
      const dockerfiles = sandbox.stub(DockerHelper, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      const build = sandbox.stub(DockerHelper, 'buildImage')
      const push = sandbox.stub(DockerHelper, 'pushImage')
        .withArgs('registry.heroku.com/testapp/web')

      await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])

      expect(stdout.output).to.contain('Building web (/path/to/Dockerfile)')
      expect(stdout.output).to.contain('Pushing web (/path/to/Dockerfile)')
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledOnce(build)
      expect(build.getCall(0).args[0].dockerfile).to.equal('/path/to/Dockerfile')
      expect(build.getCall(0).args[0].resource).to.equal('registry.heroku.com/testapp/web')
      sandbox.assert.calledOnce(push)
    })
  })

  context('when the app is a container app', function () {
    beforeEach(function () {
      api
        .get('/apps/testapp')
        .reply(200, {name: 'testapp', stack: {name: 'container'}})
    })

    it('gets a build error', async function () {
      let error
      const dockerfiles = sandbox.stub(DockerHelper, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      const build = sandbox.stub(DockerHelper, 'buildImage')
        .throws()

      await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ]).catch(error_ => {
        error = error_
      })
      const {message, oclif} = error as unknown as CLIError
      expect(message).to.contain('docker build exited with Error: Error')
      expect(oclif.exit).to.equal(1)

      expect(stdout.output).to.contain('Building web (/path/to/Dockerfile)')
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledOnce(build)
    })

    it('gets a push error', async function () {
      let error
      const dockerfiles = sandbox.stub(DockerHelper, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      const build = sandbox.stub(DockerHelper, 'buildImage')
      const push = sandbox.stub(DockerHelper, 'pushImage')
        .throws()

      await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ]).catch(error_ => {
        error = error_
      })
      const {message, oclif} = error as unknown as CLIError
      expect(message).to.contain('docker push exited with Error: Error')
      expect(oclif.exit).to.equal(1)

      expect(stdout.output).to.contain('Building web (/path/to/Dockerfile)')
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledOnce(build)
      sandbox.assert.calledOnce(push)
    })

    it('pushes to the docker registry', async function () {
      const dockerfiles = sandbox.stub(DockerHelper, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      const build = sandbox.stub(DockerHelper, 'buildImage')
      const push = sandbox.stub(DockerHelper, 'pushImage')
        .withArgs('registry.heroku.com/testapp/web')

      await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])

      expect(stdout.output).to.contain('Building web (/path/to/Dockerfile)')
      expect(stdout.output).to.contain('Pushing web (/path/to/Dockerfile)')
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledOnce(build)
      expect(build.getCall(0).args[0].dockerfile).to.equal('/path/to/Dockerfile')
      expect(build.getCall(0).args[0].resource).to.equal('registry.heroku.com/testapp/web')
      sandbox.assert.calledOnce(push)
    })

    it('pushes the standard dockerfile to non-web', async function () {
      const dockerfiles = sandbox.stub(DockerHelper, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      const build = sandbox.stub(DockerHelper, 'buildImage')
      const push = sandbox.stub(DockerHelper, 'pushImage')
        .withArgs('registry.heroku.com/testapp/worker')

      await runCommand(Cmd, [
        '--app',
        'testapp',
        'worker',
      ])

      expect(stdout.output).to.contain('Building worker (/path/to/Dockerfile)')
      expect(stdout.output).to.contain('Pushing worker (/path/to/Dockerfile)')
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledOnce(build)
      expect(build.getCall(0).args[0].dockerfile).to.equal('/path/to/Dockerfile')
      expect(build.getCall(0).args[0].resource).to.equal('registry.heroku.com/testapp/worker')
      sandbox.assert.calledOnce(push)
    })

    it('pushes specified dockerfiles recursively', async function () {
      const dockerfiles = sandbox.stub(DockerHelper, 'getDockerfiles')
        .returns(['/path/to/Dockerfile.web', '/path/to/Dockerfile.worker'])
      const build = sandbox.stub(DockerHelper, 'buildImage')
      const push = sandbox.stub(DockerHelper, 'pushImage')
      push.withArgs('registry.heroku.com/testapp/web')
      push.withArgs('registry.heroku.com/testapp/worker')

      await runCommand(Cmd, [
        '--app',
        'testapp',
        '--recursive',
        'web',
        'worker',
      ])

      expect(stdout.output).to.contain('Building web (/path/to/Dockerfile.web)')
      expect(stdout.output).to.contain('Building worker (/path/to/Dockerfile.worker)')
      expect(stdout.output).to.contain('Pushing web (/path/to/Dockerfile.web)')
      expect(stdout.output).to.contain('Pushing worker (/path/to/Dockerfile.worker)')
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledTwice(build)
      expect(build.getCall(0).args[0].dockerfile).to.equal('/path/to/Dockerfile.web')
      expect(build.getCall(1).args[0].dockerfile).to.equal('/path/to/Dockerfile.worker')
      sandbox.assert.calledTwice(push)
    })

    it('warns when a specified Dockerfile is missing', async function () {
      const dockerfiles = sandbox.stub(DockerHelper, 'getDockerfiles')
        .returns(['/path/to/Dockerfile.web'])
      const build = sandbox.stub(DockerHelper, 'buildImage')
      build.withArgs('/path/to/Dockerfile.web', 'registry.heroku.com/testapp/web', [])
      build.withArgs('/path/to/Dockerfile.worker', 'registry.heroku.com/testapp/worker', [])
      const push = sandbox.stub(DockerHelper, 'pushImage')
      push.withArgs('registry.heroku.com/testapp/web')
      push.withArgs('registry.heroku.com/testapp/worker')

      await runCommand(Cmd, [
        '--app',
        'testapp',
        '--recursive',
        'web',
        'worker',
      ])

      expect(stdout.output).to.contain('Building web (/path/to/Dockerfile.web)')
      expect(stdout.output).to.contain('Pushing web (/path/to/Dockerfile.web)')
      expect(stderr.output).to.contain('Dockerfile.worker not found')
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledOnce(build)
      sandbox.assert.calledOnce(push)
    })

    it('pushes all dockerfiles recursively when process types are not specified', async function () {
      const dockerfiles = sandbox.stub(DockerHelper, 'getDockerfiles')
        .returns(['/path/to/Dockerfile.web', '/path/to/Dockerfile.worker'])
      const build = sandbox.stub(DockerHelper, 'buildImage')
      const push = sandbox.stub(DockerHelper, 'pushImage')
      push.withArgs('registry.heroku.com/testapp/web')
      push.withArgs('registry.heroku.com/testapp/worker')

      await runCommand(Cmd, [
        '--app',
        'testapp',
        '--recursive',
      ])

      expect(stdout.output).to.contain('Building web (/path/to/Dockerfile.web)')
      expect(stdout.output).to.contain('Building worker (/path/to/Dockerfile.worker)')
      expect(stdout.output).to.contain('Pushing web (/path/to/Dockerfile.web)')
      expect(stdout.output).to.contain('Pushing worker (/path/to/Dockerfile.worker)')
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledTwice(build)
      expect(build.getCall(0).args[0].dockerfile).to.equal('/path/to/Dockerfile.web')
      expect(build.getCall(1).args[0].dockerfile).to.equal('/path/to/Dockerfile.worker')
      sandbox.assert.calledTwice(push)
    })

    it('builds with custom context path and pushes to the docker registry', async function () {
      const dockerfiles = sandbox.stub(DockerHelper, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      const build = sandbox.stub(DockerHelper, 'buildImage')
      const push = sandbox.stub(DockerHelper, 'pushImage')
        .withArgs('registry.heroku.com/testapp/web')

      await runCommand(Cmd, [
        '--app',
        'testapp',
        '--context-path',
        '/custom/context/path',
        'web',
      ])

      const buildCallArgs = build.getCall(0).args[0]

      expect(stdout.output).to.contain('Building web (/path/to/Dockerfile)')
      expect(stdout.output).to.contain('Pushing web (/path/to/Dockerfile)')
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledOnce(build)
      expect(buildCallArgs.dockerfile).to.equal('/path/to/Dockerfile')
      expect(buildCallArgs.resource).to.equal('registry.heroku.com/testapp/web')
      expect(buildCallArgs.path).to.equal('/custom/context/path')
      sandbox.assert.calledOnce(push)
    })

    it('does not find an image to push', async function () {
      let error
      const dockerfiles = sandbox.stub(DockerHelper, 'getDockerfiles')
        .returns([])

      await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ]).catch(error_ => {
        error = error_
      })
      const {message, oclif} = error as unknown as CLIError
      expect(message).to.contain('No images to push')
      expect(oclif.exit).to.equal(1)

      expect(stdout.output, 'to be empty')
      sandbox.assert.calledOnce(dockerfiles)
    })
  })

  it('requires a process type if we are not recursive', async function () {
    let error
    await runCommand(Cmd, [
      '--app',
      'testapp',
    ]).catch(error_ => {
      error = error_
    })
    const {message, oclif} = error as unknown as CLIError
    expect(message).to.contain('Requires either --recursive or one or more process types')
    expect(oclif.exit).to.equal(1)
    expect(stdout.output).to.equal('')
  })

  it('rejects multiple process types if we are not recursive', async function () {
    let error
    await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
      'worker',
    ]).catch(error_ => {
      error = error_
    })
    const {message, oclif} = error as unknown as CLIError
    expect(message).to.contain('Requires exactly one target process type, or --recursive option')
    expect(oclif.exit).to.equal(1)
    expect(stdout.output).to.equal('')
  })
})
