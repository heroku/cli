'use strict'
/* globals describe it beforeEach afterEach */

const cli = require('heroku-cli-util')
const cmd = require('../..').commands.find(c => c.topic === 'container' && c.command === 'release')
const { expect } = require('chai')
const sinon = require('sinon')
const nock = require('nock')
const stdMocks = require('std-mocks')

let sandbox

describe('container release', () => {
  beforeEach(() => {
    cli.mockConsole()
    sandbox = sinon.createSandbox()
  })
  afterEach(() => sandbox.restore())

  it('has no process type specified', async () => {
    sandbox.stub(process, 'exit')

    await cmd.run({ app: 'testapp', args: [], flags: {} })

    expect(cli.stderr).to.contain('Requires one or more process types');
    expect(cli.stdout, 'to be empty');

    return expect(process.exit.calledWith(1)).to.equal(true)
  })

  it('releases a single process type, no previous release', async () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, { name: 'testapp' })
      .patch('/apps/testapp/formation', {
        updates: [
          { type: 'web', docker_image: 'image_id' }
        ]
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [])
      .get('/apps/testapp/releases')
      .reply(200, [{ id: 'release_id' }])
    let registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, { schemaVersion: 2, config: { digest: 'image_id' } })

    await cmd.run({ app: 'testapp', args: ['web'], flags: {} })

    expect(cli.stderr).to.contain('Releasing images web to testapp... done');
    expect(cli.stdout, 'to be empty');
    api.done();

    return registry.done()
  })

  it('releases a single process type, with a previous release', async () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, { name: 'testapp' })
      .patch('/apps/testapp/formation', {
        updates: [
          { type: 'web', docker_image: 'image_id' }
        ]
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [{ id: 'old_release_id' }])
      .get('/apps/testapp/releases')
      .reply(200, [{ id: 'release_id' }])
    let registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, { schemaVersion: 2, config: { digest: 'image_id' } })

    await cmd.run({ app: 'testapp', args: ['web'], flags: {} })

    expect(cli.stderr).to.contain('Releasing images web to testapp... done');
    expect(cli.stdout, 'to be empty');
    api.done();

    return registry.done()
  })

  it('retrieves data from a v1 schema version, no previous release', async () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, { name: 'testapp' })
      .patch('/apps/testapp/formation', {
        updates: [
          { type: 'web', docker_image: 'image_id' }
        ]
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [])
      .get('/apps/testapp/releases')
      .reply(200, [{ id: 'release_id', status: 'succeeded' }])
    let registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, { schemaVersion: 1, history: [{ v1Compatibility: '{"id":"image_id"}' }] })

    await cmd.run({ app: 'testapp', args: ['web'], flags: {} })

    expect(cli.stderr).to.contain('Releasing images web to testapp... done');
    expect(cli.stdout, 'to be empty');
    api.done();

    return registry.done()
  })

  it('retrieves data from a v1 schema version, with a previous release', async () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, { name: 'testapp' })
      .patch('/apps/testapp/formation', {
        updates: [
          { type: 'web', docker_image: 'image_id' }
        ]
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [{ id: 'old_release_id', status: 'succeeded' }])
      .get('/apps/testapp/releases')
      .reply(200, [{ id: 'release_id', status: 'succeeded' }])
    let registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, { schemaVersion: 1, history: [{ v1Compatibility: '{"id":"image_id"}' }] })

    await cmd.run({ app: 'testapp', args: ['web'], flags: {} })

    expect(cli.stderr).to.contain('Releasing images web to testapp... done');
    expect(cli.stdout, 'to be empty');
    api.done();

    return registry.done()
  })

  it('releases multiple process types, no previous release', async () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, { name: 'testapp' })
      .patch('/apps/testapp/formation', {
        updates: [
          { type: 'web', docker_image: 'web_image_id' },
          { type: 'worker', docker_image: 'worker_image_id' }
        ]
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [{ id: 'old_release_id', status: 'succeeded' }])
      .get('/apps/testapp/releases')
      .reply(200, [{ id: 'release_id', status: 'succeeded' }])
    let registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, { schemaVersion: 2, config: { digest: 'web_image_id' } })
      .get('/v2/testapp/worker/manifests/latest')
      .reply(200, { schemaVersion: 2, config: { digest: 'worker_image_id' } })

    await cmd.run({ app: 'testapp', args: ['web', 'worker'], flags: {} })

    expect(cli.stderr).to.contain('Releasing images web,worker to testapp... done');
    expect(cli.stdout, 'to be empty');
    api.done();

    return registry.done()
  })

  it('releases multiple process types, with a previous release', async () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, { name: 'testapp' })
      .patch('/apps/testapp/formation', {
        updates: [
          { type: 'web', docker_image: 'web_image_id' },
          { type: 'worker', docker_image: 'worker_image_id' }
        ]
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [{ id: 'old_release_id', status: 'succeeded' }])
      .get('/apps/testapp/releases')
      .reply(200, [{ id: 'release_id', status: 'succeeded' }])
    let registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, { schemaVersion: 2, config: { digest: 'web_image_id' } })
      .get('/v2/testapp/worker/manifests/latest')
      .reply(200, { schemaVersion: 2, config: { digest: 'worker_image_id' } })

    await cmd.run({ app: 'testapp', args: ['web', 'worker'], flags: {} })

    expect(cli.stderr).to.contain('Releasing images web,worker to testapp... done');
    expect(cli.stdout, 'to be empty');
    api.done();

    return registry.done()
  })

  it('releases with previous release and immediately successful release phase', async () => {
    stdMocks.use()
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, { name: 'testapp' })
      .patch('/apps/testapp/formation', {
        updates: [
          { type: 'web', docker_image: 'image_id' }
        ]
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [{ id: 'old_release_id', status: 'succeeded' }])
      .get('/apps/testapp/releases')
      .reply(200, [{ id: 'release_id', status: 'succeeded' }])
    let registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, { schemaVersion: 2, config: { digest: 'image_id' } })

    try {
      await cmd.run({ app: 'testapp', args: ['web'], flags: {} })

      expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content');
      expect(cli.stderr).to.contain('Runnning release command...');
      expect(cli.stdout, 'to be empty');
      api.done();
      registry.done();

      return stdMocks.restore()
    } catch (error) {
      return stdMocks.restore()
    }
  })

  it('releases with previous release and pending then successful release phase', async () => {
    stdMocks.use()
    let busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(200, 'Release Output Content')
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, { name: 'testapp' })
      .patch('/apps/testapp/formation', {
        updates: [
          { type: 'web', docker_image: 'image_id' }
        ]
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [{ id: 'old_release_id', status: 'failed' }])
      .get('/apps/testapp/releases')
      .reply(200, [{ id: 'release_id', output_stream_url: 'https://busl.test/streams/release.log', status: 'pending' }])
      .get('/apps/testapp/releases/release_id')
      .reply(200, [{ status: 'succeeded' }])
    let registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, { schemaVersion: 2, config: { digest: 'image_id' } })

    try {
      await cmd.run({ app: 'testapp', args: ['web'], flags: {} })

      expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content');
      expect(cli.stderr).to.contain('Runnning release command...');
      expect(cli.stdout, 'to be empty');
      api.done();
      registry.done();
      busl.done();

      return stdMocks.restore()
    } catch (error) {
      return stdMocks.restore()
    }
  })

  it('releases with previous release and immediately failed release phase', async () => {
    sandbox.stub(process, 'exit')

    stdMocks.use()
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, { name: 'testapp' })
      .patch('/apps/testapp/formation', {
        updates: [
          { type: 'web', docker_image: 'image_id' }
        ]
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [{ id: 'old_release_id', status: 'succeeded' }])
      .get('/apps/testapp/releases')
      .reply(200, [{ id: 'release_id', status: 'failed' }])
    let registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, { schemaVersion: 2, config: { digest: 'image_id' } })

    try {
      await cmd.run({ app: 'testapp', args: ['web'], flags: {} })

      expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content');
      expect(cli.stderr).to.contain('Runnning release command...');
      expect(cli.stderr).to.contain('Error: release command failed');
      expect(cli.stdout, 'to be empty');
      expect(cli.exit.calledWith(1)).to.equal(true);
      api.done();
      registry.done();

      return stdMocks.restore()
    } catch (error) {
      return stdMocks.restore()
    }
  })

  it('releases with previous release and pending then failed release phase', async () => {
    sandbox.stub(process, 'exit')

    stdMocks.use()
    let busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(200, 'Release Output Content')
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, { name: 'testapp' })
      .patch('/apps/testapp/formation', {
        updates: [
          { type: 'web', docker_image: 'image_id' }
        ]
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [{ id: 'old_release_id', status: 'succeeded' }])
      .get('/apps/testapp/releases')
      .reply(200, [{ id: 'release_id', output_stream_url: 'https://busl.test/streams/release.log', status: 'pending' }])
      .get('/apps/testapp/releases/release_id')
      .reply(200, [{ status: 'failed' }])
    let registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, { schemaVersion: 2, config: { digest: 'image_id' } })

    try {
      await cmd.run({ app: 'testapp', args: ['web'], flags: {} })

      expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content');
      expect(cli.stderr).to.contain('Runnning release command...');
      expect(cli.stderr).to.contain('Error: release command failed');
      expect(cli.stdout, 'to be empty');
      expect(process.exit.calledWith(1)).to.equal(true);
      api.done();
      registry.done();
      busl.done();

      return stdMocks.restore()
    } catch (error) {
      return stdMocks.restore()
    }
  })

  it('releases with no previous release and immediately successful release phase', async () => {
    stdMocks.use()
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, { name: 'testapp' })
      .patch('/apps/testapp/formation', {
        updates: [
          { type: 'web', docker_image: 'image_id' }
        ]
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [{ status: 'succeeded' }])
    let registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, { schemaVersion: 2, config: { digest: 'image_id' } })

    try {
      await cmd.run({ app: 'testapp', args: ['web'], flags: {} })

      expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content');
      expect(cli.stderr).to.contain('Runnning release command...');
      expect(cli.stdout, 'to be empty');
      api.done();
      registry.done();

      return stdMocks.restore()
    } catch (error) {
      return stdMocks.restore()
    }
  })

  it('releases with no previous release and pending then successful release phase', async () => {
    stdMocks.use()
    let busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(200, 'Release Output Content')
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, { name: 'testapp' })
      .patch('/apps/testapp/formation', {
        updates: [
          { type: 'web', docker_image: 'image_id' }
        ]
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [])
      .get('/apps/testapp/releases')
      .reply(200, [{ id: 'release_id', output_stream_url: 'https://busl.test/streams/release.log', status: 'pending' }])
      .get('/apps/testapp/releases/release_id')
      .reply(200, [{ status: 'succeeded' }])
    let registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, { schemaVersion: 2, config: { digest: 'image_id' } })

    try {
      await cmd.run({ app: 'testapp', args: ['web'], flags: {} })

      expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content');
      expect(cli.stderr).to.contain('Runnning release command...');
      expect(cli.stdout, 'to be empty');
      api.done();
      registry.done();
      busl.done();

      return stdMocks.restore()
    } catch (error) {
      return stdMocks.restore()
    }
  })

  it('releases with no previous release and immediately failed release phase', async () => {
    sandbox.stub(process, 'exit')

    stdMocks.use()
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, { name: 'testapp' })
      .patch('/apps/testapp/formation', {
        updates: [
          { type: 'web', docker_image: 'image_id' }
        ]
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [])
      .get('/apps/testapp/releases')
      .reply(200, [{ status: 'failed' }])
    let registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, { schemaVersion: 2, config: { digest: 'image_id' } })

    try {
      await cmd.run({ app: 'testapp', args: ['web'], flags: {} })

      expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content');
      expect(cli.stderr).to.contain('Runnning release command...');
      expect(cli.stderr).to.contain('Error: release command failed');
      expect(cli.stdout, 'to be empty');
      expect(cli.exit.calledWith(1)).to.equal(true);
      api.done();
      registry.done();

      return stdMocks.restore()
    } catch (error) {
      return stdMocks.restore()
    }
  })

  it('releases with no previous release and pending then failed release phase', async () => {
    sandbox.stub(process, 'exit')

    stdMocks.use()
    let busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(200, 'Release Output Content')
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, { name: 'testapp' })
      .patch('/apps/testapp/formation', {
        updates: [
          { type: 'web', docker_image: 'image_id' }
        ]
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [])
      .get('/apps/testapp/releases')
      .reply(200, [{ id: 'release_id', output_stream_url: 'https://busl.test/streams/release.log', status: 'pending' }])
      .get('/apps/testapp/releases/release_id')
      .reply(200, [{ status: 'failed' }])
    let registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, { schemaVersion: 2, config: { digest: 'image_id' } })

    try {
      await cmd.run({ app: 'testapp', args: ['web'], flags: {} })

      expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content');
      expect(cli.stderr).to.contain('Runnning release command...');
      expect(cli.stderr).to.contain('Error: release command failed');
      expect(cli.stdout, 'to be empty');
      expect(process.exit.calledWith(1)).to.equal(true);
      api.done();
      registry.done();
      busl.done();

      return stdMocks.restore()
    } catch (error) {
      return stdMocks.restore()
    }
  })

  it('has release phase but no new release', async () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, { name: 'testapp' })
      .patch('/apps/testapp/formation', {
        updates: [
          { type: 'web', docker_image: 'image_id' }
        ]
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [{ id: 'old_release_id', status: 'succeeded' }])
      .get('/apps/testapp/releases')
      .reply(200, [{ id: 'old_release_id', status: 'succeeded' }])
    let registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, { schemaVersion: 2, config: { digest: 'image_id' } })

    await cmd.run({ app: 'testapp', args: ['web'], flags: {} })

    expect(cli.stderr, 'not to contain', 'Runnning release command...');
    expect(cli.stdout, 'to be empty');
    api.done();

    return registry.done()
  })
})
