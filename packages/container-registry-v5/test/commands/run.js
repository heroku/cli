'use strict'
/* globals beforeEach afterEach */

const cli = require('heroku-cli-util')
const cmd = require('../..').commands.find(c => c.topic === 'container' && c.command === 'run')
const {expect} = require('chai')
const sinon = require('sinon')

const Sanbashi = require('../../lib/sanbashi')
let sandbox

describe('container run', () => {
  beforeEach(() => {
    cli.mockConsole()
    process.env.HEROKU_API_KEY = 'heroku_token'
    sandbox = sinon.createSandbox()
  })
  afterEach(() => sandbox.restore())

  it('requires a process type', () => {
    sandbox.stub(process, 'exit')

    return cmd.run({app: 'testapp', args: [], flags: {}})
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => expect(cli.stderr).to.contain('Requires one process type'))
      .then(() => expect(process.exit.calledWith(1)).to.equal(true))
  })

  it('runs a container', () => {
    let dockerfiles = sandbox.stub(Sanbashi, 'getDockerfiles')
      .returns(['/path/to/Dockerfile'])
    let run = sandbox.stub(Sanbashi, 'runImage')
      .withArgs('registry.heroku.com/testapp/web', [])

    return cmd.run({app: 'testapp', args: ['web'], flags: {}})
      .then(() => expect(cli.stdout).to.contain('Running registry.heroku.com/testapp/web'))
      .then(() => expect(cli.stderr, 'to be empty'))
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
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => sandbox.assert.calledOnce(dockerfiles))
      .then(() => sandbox.assert.calledOnce(run))
  })

  it('requires a known dockerfile', () => {
    let dockerfiles = sandbox.stub(Sanbashi, 'getDockerfiles')
      .returns([])

    return cmd.run({app: 'testapp', args: ['worker'], flags: {}})
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => expect(cli.stderr).to.contain('No images to run'))
      .then(() => sandbox.assert.calledOnce(dockerfiles))
  })
})
