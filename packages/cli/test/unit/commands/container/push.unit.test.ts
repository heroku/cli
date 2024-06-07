import {stdout} from 'stdout-stderr'
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
      await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ]).catch((error: any) => {
        const {message, oclif} = error as CLIError
        expect(message).to.equal(`This command is for Docker apps only. Run ${color.cyan('git push heroku main')} to deploy your ${color.cyan('testapp')} ${color.cyan('heroku-24')} app instead.`)
        expect(oclif.exit).to.equal(1)
      })
    })
  })

  context('when the app is a container app', function () {
    beforeEach(function () {
      api
        .get('/apps/testapp')
        .reply(200, {name: 'testapp', stack: {name: 'container'}})
    })

    it('gets a build error', async function () {
      const dockerfiles = sandbox.stub(DockerHelper, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      const build = sandbox.stub(DockerHelper, 'buildImage')
        .throws()

      try {
        await runCommand(Cmd, [
          '--app',
          'testapp',
          'web',
        ])
      } catch (error) {
        const {message, oclif} = error as CLIError
        expect(message).to.contain('docker build exited with Error: Error')
        expect(oclif.exit).to.equal(1)
      }

      expect(stdout.output).to.contain('Building web (/path/to/Dockerfile)')
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledOnce(build)
    })

    it('gets a push error', async function () {
      const dockerfiles = sandbox.stub(DockerHelper, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      const build = sandbox.stub(DockerHelper, 'buildImage')
      const push = sandbox.stub(DockerHelper, 'pushImage')
        .throws()

      try {
        await runCommand(Cmd, [
          '--app',
          'testapp',
          'web',
        ])
      } catch (error) {
        const {message, oclif} = error as CLIError
        expect(message).to.contain('docker push exited with Error: Error')
        expect(oclif.exit).to.equal(1)
      }

      expect(stdout.output).to.contain('Building web (/path/to/Dockerfile)')
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledOnce(build)
      sandbox.assert.calledOnce(push)
    })

    it('pushes to the docker registry', async function () {
      const dockerfiles = sandbox.stub(DockerHelper, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      const build = sandbox.stub(DockerHelper, 'buildImage')
        .withArgs('/path/to/Dockerfile', 'registry.heroku.com/testapp/web', [])
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
      sandbox.assert.calledOnce(push)
    })

    it('pushes the standard dockerfile to non-web', async function () {
      const dockerfiles = sandbox.stub(DockerHelper, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      const build = sandbox.stub(DockerHelper, 'buildImage')
        .withArgs('/path/to/Dockerfile', 'registry.heroku.com/testapp/worker', [])
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
      sandbox.assert.calledOnce(push)
    })

    it('pushes several dockerfiles recursively', async function () {
      const dockerfiles = sandbox.stub(DockerHelper, 'getDockerfiles')
        .returns(['/path/to/Dockerfile.web', '/path/to/Dockerfile.worker'])
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
      expect(stdout.output).to.contain('Building worker (/path/to/Dockerfile.worker)')
      expect(stdout.output).to.contain('Pushing web (/path/to/Dockerfile.web)')
      expect(stdout.output).to.contain('Pushing worker (/path/to/Dockerfile.worker)')
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledTwice(build)
      sandbox.assert.calledTwice(push)
    })

    it('builds with custom context path and pushes to the docker registry', async function () {
      const dockerfiles = sandbox.stub(DockerHelper, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      const build = sandbox.stub(DockerHelper, 'buildImage')
        .withArgs('/path/to/Dockerfile', 'registry.heroku.com/testapp/web', [], '/custom/context/path')
      const push = sandbox.stub(DockerHelper, 'pushImage')
        .withArgs('registry.heroku.com/testapp/web')

      await runCommand(Cmd, [
        '--app',
        'testapp',
        '--context-path',
        '/custom/context/path',
        'web',
      ])

      expect(stdout.output).to.contain('Building web (/path/to/Dockerfile)')
      expect(stdout.output).to.contain('Pushing web (/path/to/Dockerfile)')
      sandbox.assert.calledOnce(dockerfiles)
      sandbox.assert.calledOnce(build)
      sandbox.assert.calledOnce(push)
    })

    it('does not find an image to push', async function () {
      const dockerfiles = sandbox.stub(DockerHelper, 'getDockerfiles')
        .returns([])

      try {
        await runCommand(Cmd, [
          '--app',
          'testapp',
          'web',
        ])
      } catch (error) {
        const {message, oclif} = error as CLIError
        expect(message).to.contain('No images to push')
        expect(oclif.exit).to.equal(1)
      }

      expect(stdout.output, 'to be empty')
      sandbox.assert.calledOnce(dockerfiles)
    })
  })

  it('requires a process type if we are not recursive', async function () {
    try {
      await runCommand(Cmd, [
        '--app',
        'testapp',
      ])
    } catch (error) {
      const {message, oclif} = error as CLIError
      expect(message).to.contain('Requires either --recursive or one or more process types')
      expect(oclif.exit).to.equal(1)
    }

    expect(stdout.output).to.equal('')
  })

  it('rejects multiple process types if we are not recursive', async function () {
    try {
      await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
        'worker',
      ])
    } catch (error) {
      const {message, oclif} = error as CLIError
      expect(message).to.contain('Requires exactly one target process type, or --recursive option')
      expect(oclif.exit).to.equal(1)
    }

    expect(stdout.output).to.equal('')
  })
})
