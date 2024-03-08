import {stdout, stderr} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/container/release'
import runCommand from '../../../helpers/runCommand'
import {expect} from 'chai'
import * as sinon from 'sinon'
import * as nock from 'nock'
import stdMocks = require('std-mocks')

let sandbox: { restore: () => void; stub: (arg0: NodeJS.Process, arg1: string) => void }

describe('container release', () => {
  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })
  afterEach(() => sandbox.restore())
  it('has no process type specified', async () => {
    await runCommand(Cmd, [
      '--app',
      'testapp',
    ])
      .catch((error:any) => {
        expect(error.message).to.contain('Requires one or more process types')
        expect(stdout.output, 'to be empty')
      })
  })
  it('releases a single process type, no previous release', async () => {
    const api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp'})
      .patch('/apps/testapp/formation', {
        updates: [
          {type: 'web', docker_image: 'image_id'},
        ],
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [])
      .get('/apps/testapp/releases')
      .reply(200, [{id: 'release_id'}])
    const registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, {schemaVersion: 2, config: {digest: 'image_id'}})
    await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ])
    expect(stderr.output).to.contain('Releasing images web to testapp... done')
    expect(stdout.output, 'to be empty')
    api.done()
    registry.done()
  })
  it('releases a single process type, with a previous release', async () => {
    const api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp'})
      .patch('/apps/testapp/formation', {
        updates: [
          {type: 'web', docker_image: 'image_id'},
        ],
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [{id: 'old_release_id'}])
      .get('/apps/testapp/releases')
      .reply(200, [{id: 'release_id'}])
    const registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, {schemaVersion: 2, config: {digest: 'image_id'}})
    await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ])
    expect(stderr.output).to.contain('Releasing images web to testapp... done')
    expect(stdout.output, 'to be empty')
    api.done()
    registry.done()
  })
  it('retrieves data from a v1 schema version, no previous release', async () => {
    const api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp'})
      .patch('/apps/testapp/formation', {
        updates: [
          {type: 'web', docker_image: 'image_id'},
        ],
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [])
      .get('/apps/testapp/releases')
      .reply(200, [{id: 'release_id', status: 'succeeded'}])
    const registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, {schemaVersion: 1, history: [{v1Compatibility: '{"id":"image_id"}'}]})
    await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ])
    expect(stderr.output).to.contain('Releasing images web to testapp... done')
    expect(stdout.output, 'to be empty')
    api.done()
    registry.done()
  })
  it('retrieves data from a v1 schema version, with a previous release', async () => {
    const api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp'})
      .patch('/apps/testapp/formation', {
        updates: [
          {type: 'web', docker_image: 'image_id'},
        ],
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [{id: 'old_release_id', status: 'succeeded'}])
      .get('/apps/testapp/releases')
      .reply(200, [{id: 'release_id', status: 'succeeded'}])
    const registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, {schemaVersion: 1, history: [{v1Compatibility: '{"id":"image_id"}'}]})
    await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ])
    expect(stderr.output).to.contain('Releasing images web to testapp... done')
    expect(stdout.output, 'to be empty')
    api.done()
    registry.done()
  })
  it('releases multiple process types, no previous release', async () => {
    const api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp'})
      .patch('/apps/testapp/formation', {
        updates: [
          {type: 'web', docker_image: 'web_image_id'}, {type: 'worker', docker_image: 'worker_image_id'},
        ],
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [{id: 'old_release_id', status: 'succeeded'}])
      .get('/apps/testapp/releases')
      .reply(200, [{id: 'release_id', status: 'succeeded'}])
    const registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, {schemaVersion: 2, config: {digest: 'web_image_id'}})
      .get('/v2/testapp/worker/manifests/latest')
      .reply(200, {schemaVersion: 2, config: {digest: 'worker_image_id'}})
    await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
      'worker',
    ])
    expect(stderr.output).to.contain('Releasing images web,worker to testapp... done')
    expect(stdout.output, 'to be empty')
    api.done()
    registry.done()
  })
  it('releases multiple process types, with a previous release', async () => {
    const api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp'})
      .patch('/apps/testapp/formation', {
        updates: [
          {type: 'web', docker_image: 'web_image_id'}, {type: 'worker', docker_image: 'worker_image_id'},
        ],
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [{id: 'old_release_id', status: 'succeeded'}])
      .get('/apps/testapp/releases')
      .reply(200, [{id: 'release_id', status: 'succeeded'}])
    const registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, {schemaVersion: 2, config: {digest: 'web_image_id'}})
      .get('/v2/testapp/worker/manifests/latest')
      .reply(200, {schemaVersion: 2, config: {digest: 'worker_image_id'}})
    await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
      'worker',
    ])
    expect(stderr.output).to.contain('Releasing images web,worker to testapp... done')
    expect(stdout.output, 'to be empty')
    api.done()
    registry.done()
  })
  it('releases with previous release and immediately successful release phase', () => {
    stdMocks.use()
    const api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp'})
      .patch('/apps/testapp/formation', {
        updates: [
          {type: 'web', docker_image: 'image_id'},
        ],
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [{id: 'old_release_id', status: 'succeeded'}])
      .get('/apps/testapp/releases')
      .reply(200, [{id: 'release_id', status: 'succeeded'}])
    const registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, {schemaVersion: 2, config: {digest: 'image_id'}})
    return runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ])
      .then(() => expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content'))
      .then(() => expect(stderr.output).to.contain('Runnning release command...'))
      .then(() => expect(stdout.output, 'to be empty'))
      .then(() => api.done())
      .then(() => registry.done())
      .then(() => stdMocks.restore())
      .catch(() => stdMocks.restore())
  })
  it('releases with previous release and pending then successful release phase', () => {
    stdMocks.use()
    const busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(200, 'Release Output Content')
    const api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp'})
      .patch('/apps/testapp/formation', {
        updates: [
          {type: 'web', docker_image: 'image_id'},
        ],
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [{id: 'old_release_id', status: 'failed'}])
      .get('/apps/testapp/releases')
      .reply(200, [{id: 'release_id', output_stream_url: 'https://busl.test/streams/release.log', status: 'pending'}])
      .get('/apps/testapp/releases/release_id')
      .reply(200, [{status: 'succeeded'}])
    const registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, {schemaVersion: 2, config: {digest: 'image_id'}})
    return runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ])
      .then(() => expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content'))
      .then(() => expect(stderr.output).to.contain('Runnning release command...'))
      .then(() => expect(stdout.output, 'to be empty'))
      .then(() => api.done())
      .then(() => registry.done())
      .then(() => busl.done())
      .then(() => stdMocks.restore())
      .catch(() => stdMocks.restore())
  })
  it('releases with previous release and immediately failed release phase', () => {
    sandbox.stub(process, 'exit')
    stdMocks.use()
    const api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp'})
      .patch('/apps/testapp/formation', {
        updates: [
          {type: 'web', docker_image: 'image_id'},
        ],
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [{id: 'old_release_id', status: 'succeeded'}])
      .get('/apps/testapp/releases')
      .reply(200, [{id: 'release_id', status: 'failed'}])
    const registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, {schemaVersion: 2, config: {digest: 'image_id'}})
    return runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ])
      .then(() => expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content'))
      .then(() => expect(stderr.output).to.contain('Runnning release command...'))
      .then(() => expect(stderr.output).to.contain('Error: release command failed'))
      .then(() => expect(stdout.output, 'to be empty'))
      .then(() => api.done())
      .then(() => registry.done())
      .then(() => stdMocks.restore())
      .catch(() => stdMocks.restore())
  })
  it('releases with previous release and pending then failed release phase', () => {
    sandbox.stub(process, 'exit')
    stdMocks.use()
    const busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(200, 'Release Output Content')
    const api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp'})
      .patch('/apps/testapp/formation', {
        updates: [
          {type: 'web', docker_image: 'image_id'},
        ],
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [{id: 'old_release_id', status: 'succeeded'}])
      .get('/apps/testapp/releases')
      .reply(200, [{id: 'release_id', output_stream_url: 'https://busl.test/streams/release.log', status: 'pending'}])
      .get('/apps/testapp/releases/release_id')
      .reply(200, [{status: 'failed'}])
    const registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, {schemaVersion: 2, config: {digest: 'image_id'}})
    return runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ])
      .then(() => expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content'))
      .then(() => expect(stderr.output).to.contain('Runnning release command...'))
      .then(() => expect(stderr.output).to.contain('Error: release command failed'))
      .then(() => expect(stdout.output, 'to be empty'))
      .then(() => api.done())
      .then(() => registry.done())
      .then(() => busl.done())
      .then(() => stdMocks.restore())
      .catch(() => stdMocks.restore())
  })
  it('releases with no previous release and immediately successful release phase', () => {
    stdMocks.use()
    const api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp'})
      .patch('/apps/testapp/formation', {
        updates: [
          {type: 'web', docker_image: 'image_id'},
        ],
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [{status: 'succeeded'}])
    const registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, {schemaVersion: 2, config: {digest: 'image_id'}})
    return runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ])
      .then(() => expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content'))
      .then(() => expect(stderr.output).to.contain('Runnning release command...'))
      .then(() => expect(stdout.output, 'to be empty'))
      .then(() => api.done())
      .then(() => registry.done())
      .then(() => stdMocks.restore())
      .catch(() => stdMocks.restore())
  })
  it('releases with no previous release and pending then successful release phase', () => {
    stdMocks.use()
    const busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(200, 'Release Output Content')
    const api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp'})
      .patch('/apps/testapp/formation', {
        updates: [
          {type: 'web', docker_image: 'image_id'},
        ],
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [])
      .get('/apps/testapp/releases')
      .reply(200, [{id: 'release_id', output_stream_url: 'https://busl.test/streams/release.log', status: 'pending'}])
      .get('/apps/testapp/releases/release_id')
      .reply(200, [{status: 'succeeded'}])
    const registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, {schemaVersion: 2, config: {digest: 'image_id'}})
    return runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ])
      .then(() => expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content'))
      .then(() => expect(stderr.output).to.contain('Runnning release command...'))
      .then(() => expect(stdout.output, 'to be empty'))
      .then(() => api.done())
      .then(() => registry.done())
      .then(() => busl.done())
      .then(() => stdMocks.restore())
      .catch(() => stdMocks.restore())
  })
  it('releases with no previous release and immediately failed release phase', () => {
    sandbox.stub(process, 'exit')
    stdMocks.use()
    const api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp'})
      .patch('/apps/testapp/formation', {
        updates: [
          {type: 'web', docker_image: 'image_id'},
        ],
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [])
      .get('/apps/testapp/releases')
      .reply(200, [{status: 'failed'}])
    const registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, {schemaVersion: 2, config: {digest: 'image_id'}})
    return runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ])
      .then(() => expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content'))
      .then(() => expect(stderr.output).to.contain('Runnning release command...'))
      .then(() => expect(stderr.output).to.contain('Error: release command failed'))
      .then(() => expect(stdout.output, 'to be empty'))
      .then(() => api.done())
      .then(() => registry.done())
      .then(() => stdMocks.restore())
      .catch(() => stdMocks.restore())
  })
  it('releases with no previous release and pending then failed release phase', () => {
    sandbox.stub(process, 'exit')
    stdMocks.use()
    const busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(200, 'Release Output Content')
    const api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp'})
      .patch('/apps/testapp/formation', {
        updates: [
          {type: 'web', docker_image: 'image_id'},
        ],
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [])
      .get('/apps/testapp/releases')
      .reply(200, [{id: 'release_id', output_stream_url: 'https://busl.test/streams/release.log', status: 'pending'}])
      .get('/apps/testapp/releases/release_id')
      .reply(200, [{status: 'failed'}])
    const registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, {schemaVersion: 2, config: {digest: 'image_id'}})
    return runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ])
      .then(() => expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content'))
      .then(() => expect(stderr.output).to.contain('Runnning release command...'))
      .then(() => expect(stderr.output).to.contain('Error: release command failed'))
      .then(() => expect(stdout.output, 'to be empty'))
      .then(() => api.done())
      .then(() => registry.done())
      .then(() => busl.done())
      .then(() => stdMocks.restore())
      .catch(() => stdMocks.restore())
  })
  it('has release phase but no new release', async () => {
    const api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp'})
      .patch('/apps/testapp/formation', {
        updates: [
          {type: 'web', docker_image: 'image_id'},
        ],
      })
      .reply(200, {})
      .get('/apps/testapp/releases')
      .reply(200, [{id: 'old_release_id', status: 'succeeded'}])
      .get('/apps/testapp/releases')
      .reply(200, [{id: 'old_release_id', status: 'succeeded'}])
    const registry = nock('https://registry.heroku.com:443')
      .get('/v2/testapp/web/manifests/latest')
      .reply(200, {schemaVersion: 2, config: {digest: 'image_id'}})
    await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ])
    expect(stderr.output).to.not.contain('Running release command...')
    expect(stdout.output, 'to be empty')
    api.done()
    registry.done()
  })
})
