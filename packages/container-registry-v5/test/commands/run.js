'use strict'
/* globals describe it beforeEach afterEach */

const cli = require('heroku-cli-util')
const cmd = require('../..').commands.find(c => c.topic === 'container' && c.command === 'run')
const { expect } = require('chai')
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

  it('requires a process type', async () => {
    sandbox.stub(process, 'exit')

    await cmd.run({ app: 'testapp', args: [], flags: {} })

    expect(cli.stdout, 'to be empty');
    expect(cli.stderr).to.contain('Requires one process type');

    return expect(process.exit.calledWith(1)).to.equal(true)
  })

  it('runs a container', async () => {
    let dockerfiles = sandbox.stub(Sanbashi, 'getDockerfiles')
      .returns(['/path/to/Dockerfile'])
    let run = sandbox.stub(Sanbashi, 'runImage')
      .withArgs('registry.heroku.com/testapp/web', [])

    await cmd.run({ app: 'testapp', args: ['web'], flags: {} })

    expect(cli.stdout).to.contain('Running registry.heroku.com/testapp/web');
    expect(cli.stderr, 'to be empty');
    sandbox.assert.calledOnce(dockerfiles);

    return sandbox.assert.calledOnce(run)
  })

  it('runs a container with a command', async () => {
    let dockerfiles = sandbox.stub(Sanbashi, 'getDockerfiles')
      .returns(['/path/to/Dockerfile'])
    let run = sandbox.stub(Sanbashi, 'runImage')
      .withArgs('registry.heroku.com/testapp/web', ['bash'])

    await cmd.run({ app: 'testapp', args: ['web', 'bash'], flags: {} })

    expect(cli.stdout).to.contain('Running \'bash\' on registry.heroku.com/testapp/web');
    expect(cli.stderr, 'to be empty');
    sandbox.assert.calledOnce(dockerfiles);

    return sandbox.assert.calledOnce(run)
  })

  it('requires a known dockerfile', async () => {
    let dockerfiles = sandbox.stub(Sanbashi, 'getDockerfiles')
      .returns([])

    await cmd.run({ app: 'testapp', args: ['worker'], flags: {} })

    expect(cli.stdout, 'to be empty');
    expect(cli.stderr).to.contain('No images to run');

    return sandbox.assert.calledOnce(dockerfiles)
  })
})
