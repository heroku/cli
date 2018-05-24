'use strict'

const cli = require('heroku-cli-util')
const cmd = require('../..').commands.find(c => c.topic === 'container' && c.command === 'release')
const expect = require('unexpected')
const sinon = require('sinon')
const nock = require('nock')
const stdMocks = require('std-mocks')

const Sanbashi = require('../../lib/sanbashi')
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

  it('has an unknown image', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp'})
    let imageID = sandbox.stub(Sanbashi, 'imageID')
      .withArgs('registry.heroku.com/testapp/web:latest')
      .returns(undefined)

    return cmd.run({app: 'testapp', args: ['web'], flags: {}})
      .then(() => expect(cli.stderr, 'to contain', 'Cannot find local image ID for process type web. Did you pull it?'))
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => sandbox.assert.calledOnce(imageID))
      .then(() => api.done())
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

    let imageID = sandbox.stub(Sanbashi, 'imageID')
      .withArgs('registry.heroku.com/testapp/web:latest')
      .returns('image_id')

    return cmd.run({app: 'testapp', args: ['web'], flags: {}})
      .then(() => expect(cli.stderr, 'to contain', 'Releasing images web to testapp... done'))
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => sandbox.assert.calledOnce(imageID))
      .then(() => api.done())
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

    let imageID = sandbox.stub(Sanbashi, 'imageID')
      .callsFake(function (tag) {
        let t = tag.split(':')[0].split('/').slice(-1)[0]
        return `${t}_image_id`
      })

    return cmd.run({app: 'testapp', args: ['web', 'worker'], flags: {}})
      .then(() => expect(cli.stderr, 'to contain', 'Releasing images web,worker to testapp... done'))
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => sandbox.assert.calledTwice(imageID))
      .then(() => api.done())
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

    let imageID = sandbox.stub(Sanbashi, 'imageID')
      .withArgs('registry.heroku.com/testapp/web:latest')
      .returns('image_id')

    return cmd.run({app: 'testapp', args: ['web'], flags: {}})
      .then(() => expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content'))
      .then(() => expect(cli.stderr, 'to contain', 'Runnning release command...'))
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => sandbox.assert.calledOnce(imageID))
      .then(() => api.done())
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

    let imageID = sandbox.stub(Sanbashi, 'imageID')
      .withArgs('registry.heroku.com/testapp/web:latest')
      .returns('image_id')

    return cmd.run({app: 'testapp', args: ['web'], flags: {}})
      .then(() => expect(cli.stderr, 'not to contain', 'Runnning release command...'))
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => sandbox.assert.calledOnce(imageID))
      .then(() => api.done())
  })
})
