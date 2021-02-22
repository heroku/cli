'use strict'
/* globals describe it beforeEach afterEach */

const cli = require('heroku-cli-util')
const cmd = require('../..').commands.find(c => c.topic === 'container' && c.command === 'push')
const { expect } = require('chai')
const sinon = require('sinon')
const nock = require('nock')

const Sanbashi = require('../../lib/sanbashi')
let sandbox

describe('container push', () => {
  beforeEach(() => {
    cli.mockConsole()
    sandbox = sinon.createSandbox()
  })
  afterEach(() => sandbox.restore())

  it('gets a build error', async () => {
    sandbox.stub(process, 'exit')

    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, { name: 'testapp' })

    let dockerfiles = sandbox.stub(Sanbashi, 'getDockerfiles')
      .returns(['/path/to/Dockerfile'])
    let build = sandbox.stub(Sanbashi, 'buildImage').throws()

    await cmd.run({ app: 'testapp', args: ['web'], flags: {} })

    expect(cli.stderr).to.contain('docker build exited with Error: Error');
    expect(cli.stdout).to.contain('Building web (/path/to/Dockerfile)');
    expect(process.exit.calledWith(1)).to.equal(true);
    sandbox.assert.calledOnce(dockerfiles);
    sandbox.assert.calledOnce(build);

    return api.done()
  })

  it('gets a push error', async () => {
    sandbox.stub(process, 'exit')

    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, { name: 'testapp' })

    let dockerfiles = sandbox.stub(Sanbashi, 'getDockerfiles')
      .returns(['/path/to/Dockerfile'])
    let build = sandbox.stub(Sanbashi, 'buildImage')
    let push = sandbox.stub(Sanbashi, 'pushImage').throws()

    await cmd.run({ app: 'testapp', args: ['web'], flags: {} })

    expect(cli.stderr).to.contain('docker push exited with Error: Error');
    expect(cli.stdout).to.contain('Building web (/path/to/Dockerfile)');
    expect(process.exit.calledWith(1)).to.equal(true);
    sandbox.assert.calledOnce(dockerfiles);
    sandbox.assert.calledOnce(build);
    sandbox.assert.calledOnce(push);

    return api.done()
  })

  it('pushes to the docker registry', async () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, { name: 'testapp' })

    let dockerfiles = sandbox.stub(Sanbashi, 'getDockerfiles')
      .returns(['/path/to/Dockerfile'])
    let build = sandbox.stub(Sanbashi, 'buildImage')
      .withArgs('/path/to/Dockerfile', 'registry.heroku.com/testapp/web', [])
    let push = sandbox.stub(Sanbashi, 'pushImage')
      .withArgs('registry.heroku.com/testapp/web')

    await cmd.run({ app: 'testapp', args: ['web'], flags: {} })

    expect(cli.stdout).to.contain('Building web (/path/to/Dockerfile)');
    expect(cli.stdout).to.contain('Pushing web (/path/to/Dockerfile)');
    sandbox.assert.calledOnce(dockerfiles);
    sandbox.assert.calledOnce(build);
    sandbox.assert.calledOnce(push);

    return api.done()
  })

  it('pushes the standard dockerfile to non-web', async () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, { name: 'testapp' })

    let dockerfiles = sandbox.stub(Sanbashi, 'getDockerfiles')
      .returns(['/path/to/Dockerfile'])
    let build = sandbox.stub(Sanbashi, 'buildImage')
      .withArgs('/path/to/Dockerfile', 'registry.heroku.com/testapp/worker', [])
    let push = sandbox.stub(Sanbashi, 'pushImage')
      .withArgs('registry.heroku.com/testapp/worker')

    await cmd.run({ app: 'testapp', args: ['worker'], flags: {} })

    expect(cli.stdout).to.contain('Building worker (/path/to/Dockerfile)');
    expect(cli.stdout).to.contain('Pushing worker (/path/to/Dockerfile)');
    sandbox.assert.calledOnce(dockerfiles);
    sandbox.assert.calledOnce(build);
    sandbox.assert.calledOnce(push);

    return api.done()
  })

  it('pushes several dockerfiles recursively', async () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, { name: 'testapp' })

    let dockerfiles = sandbox.stub(Sanbashi, 'getDockerfiles')
      .returns(['/path/to/Dockerfile.web', '/path/to/Dockerfile.worker'])
    let build = sandbox.stub(Sanbashi, 'buildImage')
    build.withArgs('/path/to/Dockerfile.web', 'registry.heroku.com/testapp/web', [])
    build.withArgs('/path/to/Dockerfile.worker', 'registry.heroku.com/testapp/worker', [])
    let push = sandbox.stub(Sanbashi, 'pushImage')
    push.withArgs('registry.heroku.com/testapp/web')
    push.withArgs('registry.heroku.com/testapp/worker')

    await cmd.run({ app: 'testapp', args: ['web', 'worker'], flags: { recursive: true } })

    expect(cli.stdout).to.contain('Building web (/path/to/Dockerfile.web)');
    expect(cli.stdout).to.contain('Building worker (/path/to/Dockerfile.worker)');
    expect(cli.stdout).to.contain('Pushing web (/path/to/Dockerfile.web)');
    expect(cli.stdout).to.contain('Pushing worker (/path/to/Dockerfile.worker)');
    sandbox.assert.calledOnce(dockerfiles);
    sandbox.assert.calledTwice(build);
    sandbox.assert.calledTwice(push);

    return api.done()
  })

  it('builds with custom context path and pushes to the docker registry', async () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, { name: 'testapp' })

    let dockerfiles = sandbox.stub(Sanbashi, 'getDockerfiles')
      .returns(['/path/to/Dockerfile'])
    let build = sandbox.stub(Sanbashi, 'buildImage')
      .withArgs('/path/to/Dockerfile', 'registry.heroku.com/testapp/web', [], '/custom/context/path')
    let push = sandbox.stub(Sanbashi, 'pushImage')
      .withArgs('registry.heroku.com/testapp/web')

    await cmd.run({ app: 'testapp', args: ['web'], flags: { 'context-path': '/custom/context/path' } })

    expect(cli.stdout).to.contain('Building web (/path/to/Dockerfile)');
    expect(cli.stdout).to.contain('Pushing web (/path/to/Dockerfile)');
    sandbox.assert.calledOnce(dockerfiles);
    sandbox.assert.calledOnce(build);
    sandbox.assert.calledOnce(push);

    return api.done()
  })

  it('does not find an image to push', async () => {
    sandbox.stub(process, 'exit')

    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, { name: 'testapp' })

    let dockerfiles = sandbox.stub(Sanbashi, 'getDockerfiles')
      .returns([])

    await cmd.run({ app: 'testapp', args: ['web'], flags: {} })

    expect(cli.stderr).to.contain('No images to push');
    expect(cli.stdout, 'to be empty');
    expect(process.exit.calledWith(1)).to.equal(true);
    sandbox.assert.calledOnce(dockerfiles);

    return api.done()
  })

  it('requires a process type if we are not recursive', async () => {
    sandbox.stub(process, 'exit')

    await cmd.run({ app: 'testapp', args: [], flags: {} })

    expect(cli.stderr).to.contain('Requires either --recursive or one or more process types');
    expect(cli.stdout, 'to be empty');

    return expect(process.exit.calledWith(1)).to.equal(true)
  })

  it('rejects multiple process types if we are not recursive', async () => {
    sandbox.stub(process, 'exit')

    await cmd.run({ app: 'testapp', args: ['web', 'worker'], flags: {} })

    expect(cli.stderr).to.contain('Requires exactly one target process type, or --recursive option');
    expect(cli.stdout, 'to be empty');

    return expect(process.exit.calledWith(1)).to.equal(true)
  })
})
