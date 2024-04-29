'use strict'
/* globals beforeEach afterEach context */

const cli = require('heroku-cli-util')
const cmd = require('../../..').commands.find(c => c.topic === 'container' && c.command === 'push')
const {expect} = require('chai')
const sinon = require('sinon')
const nock = require('nock')
const testutil = require('../../testutil')

const Sanbashi = require('../../../lib/sanbashi')
let sandbox

describe('container push', () => {
  let api
  beforeEach(() => {
    cli.mockConsole()
    sandbox = sinon.createSandbox()
    cli.exit.mock()
  })
  afterEach(() => {
    sandbox.restore()
    nock.cleanAll()
  })

  context('when the app stack is not "container"', () => {
    beforeEach(() => {
      api = nock('https://api.heroku.com:443')
        .get('/apps/testapp')
        .reply(200, {name: 'testapp', stack: {name: 'heroku-24'}})
    })
    afterEach(() => api.done())

    it('exits', () => {
      return testutil.assertErrorExit(1, cmd.run({app: 'testapp', args: ['web'], flags: {}}))
        .then(error => {
          expect(error.message).to.equal('This command is for Docker apps only. Run git push heroku main to deploy your testapp heroku-24 app instead.')
        })
    })
  })

  context('when the app is a container app', () => {
    beforeEach(() => {
      api = nock('https://api.heroku.com:443')
        .get('/apps/testapp')
        .reply(200, {name: 'testapp', stack: {name: 'container'}})
    })
    afterEach(() => api.done())

    it('gets a build error', () => {
      let dockerfiles = sandbox.stub(Sanbashi, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      let build = sandbox.stub(Sanbashi, 'buildImage').throws()

      return testutil.assertErrorExit(1, cmd.run({app: 'testapp', args: ['web'], flags: {}}))
        .then(error => {
          expect(error.message).to.equal('Error: docker build exited with Error: Error')
          expect(cli.stdout).to.contain('Building web (/path/to/Dockerfile)')
          sandbox.assert.calledOnce(dockerfiles)
          sandbox.assert.calledOnce(build)
        })
    })

    it('gets a push error', () => {
      let dockerfiles = sandbox.stub(Sanbashi, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      let build = sandbox.stub(Sanbashi, 'buildImage')
      let push = sandbox.stub(Sanbashi, 'pushImage').throws()

      return testutil.assertErrorExit(1, cmd.run({app: 'testapp', args: ['web'], flags: {}}))
        .then(error => {
          expect(error.message).to.contain('docker push exited with Error: Error')
          expect(cli.stderr).to.contain('docker push exited with Error: Error')
          expect(cli.stdout).to.contain('Building web (/path/to/Dockerfile)')
          sandbox.assert.calledOnce(dockerfiles)
          sandbox.assert.calledOnce(build)
          sandbox.assert.calledOnce(push)
        })
    })

    it('pushes to the docker registry', () => {
      let dockerfiles = sandbox.stub(Sanbashi, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      let build = sandbox.stub(Sanbashi, 'buildImage')
        .withArgs('/path/to/Dockerfile', 'registry.heroku.com/testapp/web', [])
      let push = sandbox.stub(Sanbashi, 'pushImage')
        .withArgs('registry.heroku.com/testapp/web')

      return cmd.run({app: 'testapp', args: ['web'], flags: {}})
        .then(() => expect(cli.stdout).to.contain('Building web (/path/to/Dockerfile)'))
        .then(() => expect(cli.stdout).to.contain('Pushing web (/path/to/Dockerfile)'))
        .then(() => sandbox.assert.calledOnce(dockerfiles))
        .then(() => sandbox.assert.calledOnce(build))
        .then(() => sandbox.assert.calledOnce(push))
    })

    it('pushes the standard dockerfile to non-web', () => {
      let dockerfiles = sandbox.stub(Sanbashi, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      let build = sandbox.stub(Sanbashi, 'buildImage')
        .withArgs('/path/to/Dockerfile', 'registry.heroku.com/testapp/worker', [])
      let push = sandbox.stub(Sanbashi, 'pushImage')
        .withArgs('registry.heroku.com/testapp/worker')

      return cmd.run({app: 'testapp', args: ['worker'], flags: {}})
        .then(() => expect(cli.stdout).to.contain('Building worker (/path/to/Dockerfile)'))
        .then(() => expect(cli.stdout).to.contain('Pushing worker (/path/to/Dockerfile)'))
        .then(() => sandbox.assert.calledOnce(dockerfiles))
        .then(() => sandbox.assert.calledOnce(build))
        .then(() => sandbox.assert.calledOnce(push))
    })

    it('pushes several dockerfiles recursively', () => {
      let dockerfiles = sandbox.stub(Sanbashi, 'getDockerfiles')
        .returns(['/path/to/Dockerfile.web', '/path/to/Dockerfile.worker'])
      let build = sandbox.stub(Sanbashi, 'buildImage')
      build.withArgs('/path/to/Dockerfile.web', 'registry.heroku.com/testapp/web', [])
      build.withArgs('/path/to/Dockerfile.worker', 'registry.heroku.com/testapp/worker', [])
      let push = sandbox.stub(Sanbashi, 'pushImage')
      push.withArgs('registry.heroku.com/testapp/web')
      push.withArgs('registry.heroku.com/testapp/worker')

      return cmd.run({app: 'testapp', args: ['web', 'worker'], flags: {recursive: true}})
        .then(() => expect(cli.stdout).to.contain('Building web (/path/to/Dockerfile.web)'))
        .then(() => expect(cli.stdout).to.contain('Building worker (/path/to/Dockerfile.worker)'))
        .then(() => expect(cli.stdout).to.contain('Pushing web (/path/to/Dockerfile.web)'))
        .then(() => expect(cli.stdout).to.contain('Pushing worker (/path/to/Dockerfile.worker)'))
        .then(() => sandbox.assert.calledOnce(dockerfiles))
        .then(() => sandbox.assert.calledTwice(build))
        .then(() => sandbox.assert.calledTwice(push))
    })

    it('builds with custom context path and pushes to the docker registry', () => {
      let dockerfiles = sandbox.stub(Sanbashi, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      let build = sandbox.stub(Sanbashi, 'buildImage')
        .withArgs('/path/to/Dockerfile', 'registry.heroku.com/testapp/web', [], '/custom/context/path')
      let push = sandbox.stub(Sanbashi, 'pushImage')
        .withArgs('registry.heroku.com/testapp/web')

      return cmd.run({app: 'testapp', args: ['web'], flags: {'context-path': '/custom/context/path'}})
        .then(() => expect(cli.stdout).to.contain('Building web (/path/to/Dockerfile)'))
        .then(() => expect(cli.stdout).to.contain('Pushing web (/path/to/Dockerfile)'))
        .then(() => sandbox.assert.calledOnce(dockerfiles))
        .then(() => sandbox.assert.calledOnce(build))
        .then(() => sandbox.assert.calledOnce(push))
    })

    it('does not find an image to push', () => {
      let dockerfiles = sandbox.stub(Sanbashi, 'getDockerfiles')
        .returns([])

      return testutil.assertErrorExit(1, cmd.run({app: 'testapp', args: ['web'], flags: {}}))
        .then(error => {
          expect(error.message).to.contain('No images to push')
          expect(cli.stderr).to.contain('No images to push')
          expect(cli.stdout).to.equal('')
          sandbox.assert.calledOnce(dockerfiles)
        })
    })
  })

  it('requires a process type if we are not recursive', () => {
    return testutil.assertErrorExit(1, cmd.run({app: 'testapp', args: [], flags: {}}))
      .then(error => {
        expect(error.message).to.contain('Requires either --recursive or one or more process types')
        expect(cli.stderr).to.contain('Requires either --recursive or one or more process types')
        expect(cli.stdout).to.equal('')
      })
  })

  it('rejects multiple process types if we are not recursive', () => {
    return testutil.assertErrorExit(1, cmd.run({app: 'testapp', args: ['web', 'worker'], flags: {}}))
      .then(error => {
        expect(error.message).to.contain('Requires exactly one target process type, or --recursive option')
        expect(cli.stderr).to.contain('Requires exactly one target process type, or --recursive option')
        expect(cli.stdout).to.equal('')
      })
  })
})
