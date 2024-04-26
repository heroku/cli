'use strict'
/* globals beforeEach afterEach */

const cli = require('heroku-cli-util')
const cmd = require('../../..').commands.find(c => c.topic === 'container' && c.command === 'run')
const {expect} = require('chai')
const sinon = require('sinon')
const nock = require('nock')
const helpers = require('../../helpers')

const Sanbashi = require('../../../lib/sanbashi')
let sandbox

describe('container run', () => {
  beforeEach(() => {
    cli.mockConsole()
    process.env.HEROKU_API_KEY = 'heroku_token'
    sandbox = sinon.createSandbox()
    cli.exit.mock()
  })
  afterEach(() => {
    sandbox.restore()
    nock.cleanAll()
  })

  it('requires a process type', () => {
    return helpers.assertExit(1, cmd.run({app: 'testapp', args: [], flags: {}}))
      .then(error => {
        expect(error.message).to.contain('Requires one process type')
        expect(cli.stdout).to.equal('')
        expect(cli.stderr).to.contain('Requires one process type')
      })
  })

  it('exits when the app stack is not "container"', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp', stack: {name: 'heroku-24'}})

    return helpers.assertExit(1, cmd.run({app: 'testapp', args: ['web'], flags: {}}))
      .then(error => {
        expect(error.message).to.equal('This command is only supported for the container stack. The stack for app testapp is heroku-24.')
        api.done()
      })
  })

  context('when the app is a container app', () => {
    let api
    beforeEach(() => {
      api = nock('https://api.heroku.com:443')
        .get('/apps/testapp')
        .reply(200, {name: 'testapp', stack: {name: 'container'}})
    })
    afterEach(() => api.done())

    it('runs a container', () => {
      let dockerfiles = sandbox.stub(Sanbashi, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      let run = sandbox.stub(Sanbashi, 'runImage')
        .withArgs('registry.heroku.com/testapp/web', [])

      return cmd.run({app: 'testapp', args: ['web'], flags: {}})
        .then(() => expect(cli.stdout).to.contain('Running registry.heroku.com/testapp/web'))
        .then(() => sandbox.assert.calledOnce(dockerfiles))
        .then(() => sandbox.assert.calledOnce(run))
    })

    it('runs a container with a command', () => {
      let dockerfiles = sandbox.stub(Sanbashi, 'getDockerfiles')
        .returns(['/path/to/Dockerfile'])
      let run = sandbox.stub(Sanbashi, 'runImage')
        .withArgs('registry.heroku.com/testapp/web', ['bash'])

      return cmd.run({app: 'testapp', args: ['web', 'bash'], flags: {}})
        .then(() => expect(cli.stdout).to.contain('Running \'bash\' on registry.heroku.com/testapp/web'))
        .then(() => expect(cli.stderr).to.equal(''))
        .then(() => sandbox.assert.calledOnce(dockerfiles))
        .then(() => sandbox.assert.calledOnce(run))
    })

    it('requires a known dockerfile', () => {
      let dockerfiles = sandbox.stub(Sanbashi, 'getDockerfiles')
        .returns([])

      return cmd.run({app: 'testapp', args: ['worker'], flags: {}})
        .then(() => expect(cli.stdout).to.equal(''))
        .then(() => expect(cli.stderr).to.contain('No images to run'))
        .then(() => sandbox.assert.calledOnce(dockerfiles))
    })
  })
})
