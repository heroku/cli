'use strict'

const cli = require('heroku-cli-util')
const cmd = require('../..').commands.find(c => c.topic === 'container' && c.command === 'release')
const expect = require('unexpected')
const sinon = require('sinon')
const nock = require('nock')
const stdMocks = require('std-mocks')

var sandbox

describe('container release', () => {
  beforeEach(() => {
    cli.mockConsole()
    sandbox = sinon.createSandbox()
  })
  afterEach(() => sandbox.restore())

  it('has no process type specified', () => {
    return cmd.run({app: 'testapp', args: [], flags: {}})
      .then(() => expect(cli.stderr, 'to contain', 'Requires one or more process types'))
      .then(() => expect(cli.stdout, 'to be empty'))
  })

  it('releases a single process type', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp'})
      .patch('/apps/testapp/formation', {
        updates: [
          {type: 'web', docker_image: 'image_id'}
        ]
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [{}])
    let registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, {schemaVersion: 2, config: {digest: 'image_id'}})

    return cmd.run({app: 'testapp', args: ['web'], flags: {}})
      .then(() => expect(cli.stderr, 'to contain', 'Releasing images web to testapp... done'))
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => api.done())
      .then(() => registry.done())
  })

  it('retrieves data from a v1 schema version', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp'})
      .patch('/apps/testapp/formation', {
        updates: [
          {type: 'web', docker_image: 'image_id'}
        ]
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [{}])
    let registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, {schemaVersion: 1, history: [{v1Compatibility: '{"id":"image_id"}'}]})

    return cmd.run({app: 'testapp', args: ['web'], flags: {}})
      .then(() => expect(cli.stderr, 'to contain', 'Releasing images web to testapp... done'))
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => api.done())
      .then(() => registry.done())
  })

  it('releases multiple process types', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp'})
      .patch('/apps/testapp/formation', {
        updates: [
          {type: 'web', docker_image: 'web_image_id'},
          {type: 'worker', docker_image: 'worker_image_id'}
        ]
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [{}])
    let registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, {schemaVersion: 2, config: {digest: 'web_image_id'}})
      .get('/v2/testapp/worker/manifests/latest')
      .reply(200, {schemaVersion: 2, config: {digest: 'worker_image_id'}})

    return cmd.run({app: 'testapp', args: ['web', 'worker'], flags: {}})
      .then(() => expect(cli.stderr, 'to contain', 'Releasing images web,worker to testapp... done'))
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => api.done())
      .then(() => registry.done())
  })

  it('releases with release phase', () => {
    stdMocks.use()
    let busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(200, 'Release Output Content')
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp'})
      .patch('/apps/testapp/formation', {
        updates: [
          {type: 'web', docker_image: 'image_id'}
        ]
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [{output_stream_url: 'https://busl.test/streams/release.log', status: 'pending'}])
    let registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, {schemaVersion: 2, config: {digest: 'image_id'}})

    return cmd.run({app: 'testapp', args: ['web'], flags: {}})
      .then(() => expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content'))
      .then(() => expect(cli.stderr, 'to contain', 'Runnning release command...'))
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => api.done())
      .then(() => registry.done())
      .then(() => busl.done())
      .then(() => stdMocks.restore())
      .catch(() => stdMocks.restore())
  })

  it('has release phase but no new release', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp'})
      .patch('/apps/testapp/formation', {
        updates: [
          {type: 'web', docker_image: 'image_id'}
        ]
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [{output_stream_url: 'https://busl.test/streams/release.log', status: 'succeeded'}])
    let registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, {schemaVersion: 2, config: {digest: 'image_id'}})

    return cmd.run({app: 'testapp', args: ['web'], flags: {}})
      .then(() => expect(cli.stderr, 'not to contain', 'Runnning release command...'))
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => api.done())
      .then(() => registry.done())
  })
})
