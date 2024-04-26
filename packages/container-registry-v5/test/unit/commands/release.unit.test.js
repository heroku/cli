'use strict'
/* globals beforeEach afterEach */

const cli = require('heroku-cli-util')
const cmd = require('../../..').commands.find(c => c.topic === 'container' && c.command === 'release')
const {expect} = require('chai')
const nock = require('nock')
const stdMocks = require('std-mocks')
const helpers = require('../../helpers')

describe('container release', () => {
  beforeEach(() => {
    cli.mockConsole()
    cli.exit.mock()
  })
  afterEach(() => {
    nock.cleanAll()
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

  it('has no process type specified', () => {
    return helpers.assertExit(1, cmd.run({app: 'testapp', args: [], flags: {}}))
      .then(error => {
        expect(error.message).to.contain('Requires one or more process types')
        expect(cli.stderr).to.contain('Requires one or more process types')
        expect(cli.stdout).to.equal('')
      })
  })

  context('when the app is a container app', () => {
    let api
    let registry
    beforeEach(() => {
      api = nock('https://api.heroku.com:443')
        .get('/apps/testapp')
        .reply(200, {name: 'testapp', stack: {name: 'container'}})
      registry = nock('https://registry.heroku.com:443')
    })
    afterEach(() => {
      api.done()
      registry.done()
    })

    it('releases a single process type, no previous release', () => {
      api
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
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {schemaVersion: 2, config: {digest: 'image_id'}})

      return cmd.run({app: 'testapp', args: ['web'], flags: {}})
        .then(() => expect(cli.stderr).to.contain('Releasing images web to testapp... done'))
        .then(() => expect(cli.stdout).to.equal(''))
    })

    it('releases a single process type, with a previous release', () => {
      api
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
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {schemaVersion: 2, config: {digest: 'image_id'}})

      return cmd.run({app: 'testapp', args: ['web'], flags: {}})
        .then(() => expect(cli.stderr).to.contain('Releasing images web to testapp... done'))
        .then(() => expect(cli.stdout).to.equal(''))
    })

    it('retrieves data from a v1 schema version, no previous release', () => {
      api
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
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {schemaVersion: 1, history: [{v1Compatibility: '{"id":"image_id"}'}]})

      return cmd.run({app: 'testapp', args: ['web'], flags: {}})
        .then(() => expect(cli.stderr).to.contain('Releasing images web to testapp... done'))
        .then(() => expect(cli.stdout).to.equal(''))
    })

    it('retrieves data from a v1 schema version, with a previous release', () => {
      api
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
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {schemaVersion: 1, history: [{v1Compatibility: '{"id":"image_id"}'}]})

      return cmd.run({app: 'testapp', args: ['web'], flags: {}})
        .then(() => expect(cli.stderr).to.contain('Releasing images web to testapp... done'))
        .then(() => expect(cli.stdout).to.equal(''))
    })

    it('releases multiple process types, no previous release', () => {
      api
        .patch('/apps/testapp/formation', {
          updates: [
            {type: 'web', docker_image: 'web_image_id'},
            {type: 'worker', docker_image: 'worker_image_id'},
          ],
        })
        .reply(200, {})
        .get('/apps/testapp/releases')
        .reply(200, [{id: 'old_release_id', status: 'succeeded'}])
        .get('/apps/testapp/releases')
        .reply(200, [{id: 'release_id', status: 'succeeded'}])
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {schemaVersion: 2, config: {digest: 'web_image_id'}})
        .get('/v2/testapp/worker/manifests/latest')
        .reply(200, {schemaVersion: 2, config: {digest: 'worker_image_id'}})

      return cmd.run({app: 'testapp', args: ['web', 'worker'], flags: {}})
        .then(() => expect(cli.stderr).to.contain('Releasing images web,worker to testapp... done'))
        .then(() => expect(cli.stdout).to.equal(''))
    })

    it('releases multiple process types, with a previous release', () => {
      api
        .patch('/apps/testapp/formation', {
          updates: [
            {type: 'web', docker_image: 'web_image_id'},
            {type: 'worker', docker_image: 'worker_image_id'},
          ],
        })
        .reply(200, {})
        .get('/apps/testapp/releases')
        .reply(200, [{id: 'old_release_id', status: 'succeeded'}])
        .get('/apps/testapp/releases')
        .reply(200, [{id: 'release_id', status: 'succeeded'}])
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {schemaVersion: 2, config: {digest: 'web_image_id'}})
        .get('/v2/testapp/worker/manifests/latest')
        .reply(200, {schemaVersion: 2, config: {digest: 'worker_image_id'}})

      return cmd.run({app: 'testapp', args: ['web', 'worker'], flags: {}})
        .then(() => expect(cli.stderr).to.contain('Releasing images web,worker to testapp... done'))
        .then(() => expect(cli.stdout).to.equal(''))
    })

    it('releases with previous release and immediately successful release phase', () => {
      stdMocks.use()
      api
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
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {schemaVersion: 2, config: {digest: 'image_id'}})

      return cmd.run({app: 'testapp', args: ['web'], flags: {}})
        .then(() => expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content'))
        .then(() => expect(cli.stderr).to.contain('Running release command...'))
        .then(() => expect(cli.stdout).to.equal(''))
        .then(() => stdMocks.restore())
        .catch(() => stdMocks.restore())
    })

    it('releases with previous release and pending then successful release phase', () => {
      stdMocks.use()
      let busl = nock('https://busl.test:443')
        .get('/streams/release.log')
        .reply(200, 'Release Output Content')
      api
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
        .reply(200, {status: 'succeeded'})
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {schemaVersion: 2, config: {digest: 'image_id'}})

      return cmd.run({app: 'testapp', args: ['web'], flags: {}})
        .then(() => expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content'))
        .then(() => expect(cli.stderr).to.contain('Releasing images web to testapp...'))
        .then(() => expect(cli.stdout).to.contain('Running release command...'))
        .then(() => busl.done())
        .then(() => stdMocks.restore())
    })

    it('releases with previous release and immediately failed release phase', () => {
      stdMocks.use()
      api
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
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {schemaVersion: 2, config: {digest: 'image_id'}})

      return helpers.assertExit(1, cmd.run({app: 'testapp', args: ['web'], flags: {}}))
        .then(error => {
          expect(error.message).to.contain('Error: release command failed')
          expect(cli.stderr).to.contain('Releasing images web to testapp...')
          expect(cli.stderr).to.contain('Error: release command failed')
          expect(cli.stdout).to.equal('')
          stdMocks.restore()
        })
    })

    it('releases with previous release and pending then failed release phase', () => {
      stdMocks.use()
      let busl = nock('https://busl.test:443')
        .get('/streams/release.log')
        .reply(200, 'Release Output Content')
      api
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
        .reply(200, {status: 'failed'})
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {schemaVersion: 2, config: {digest: 'image_id'}})

      return helpers.assertExit(1, cmd.run({app: 'testapp', args: ['web'], flags: {}}))
        .then(error => {
          expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content')
          expect(error.message).to.contain('Error: release command failed')
          expect(cli.stderr).to.contain('Releasing images web to testapp...')
          expect(cli.stderr).to.contain('Error: release command failed')
          expect(cli.stdout).to.contain('Running release command...')
          busl.done()
          stdMocks.restore()
        })
    })

    it('releases with no previous release and immediately successful release phase', () => {
      stdMocks.use()
      api
        .patch('/apps/testapp/formation', {
          updates: [
            {type: 'web', docker_image: 'image_id'},
          ],
        })
        .reply(200, {})
        .get('/apps/testapp/releases')
        .reply(200, [])
        .get('/apps/testapp/releases')
        .reply(200, [{status: 'succeeded'}])
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {schemaVersion: 2, config: {digest: 'image_id'}})

      return cmd.run({app: 'testapp', args: ['web'], flags: {}})
        .then(() => expect(stdMocks.flush().stdout.join('')).to.equal(''))
        .then(() => expect(cli.stderr).to.contain('Releasing images web to testapp...'))
        .then(() => expect(cli.stdout).to.equal(''))
        .then(() => stdMocks.restore())
    })

    it('releases with no previous release and pending then successful release phase', () => {
      stdMocks.use()
      let busl = nock('https://busl.test:443')
        .get('/streams/release.log')
        .reply(200, 'Release Output Content')
      api
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
        .reply(200, {status: 'succeeded'})
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {schemaVersion: 2, config: {digest: 'image_id'}})

      return cmd.run({app: 'testapp', args: ['web'], flags: {}})
        .then(() => expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content'))
        .then(() => expect(cli.stderr).to.contain('Releasing images web to testapp...'))
        .then(() => expect(cli.stdout).to.contain('Running release command...'))
        .then(() => busl.done())
        .then(() => stdMocks.restore())
    })

    it('releases with no previous release and immediately failed release phase', () => {
      stdMocks.use()
      api
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
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {schemaVersion: 2, config: {digest: 'image_id'}})

      return helpers.assertExit(1, cmd.run({app: 'testapp', args: ['web'], flags: {}}))
        .then(error => {
          expect(error.message).to.contain('Error: release command failed')
          expect(stdMocks.flush().stdout.join('')).to.equal('')
          expect(cli.stderr).to.contain('Releasing images web to testapp...')
          expect(cli.stderr).to.contain('Error: release command failed')
          expect(cli.stdout).to.equal('')
          stdMocks.restore()
        })
    })

    it('releases with no previous release and pending then failed release phase', () => {
      stdMocks.use()
      let busl = nock('https://busl.test:443')
        .get('/streams/release.log')
        .reply(200, 'Release Output Content')
      api
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
        .reply(200, {status: 'failed'})
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {schemaVersion: 2, config: {digest: 'image_id'}})

      return helpers.assertExit(1, cmd.run({app: 'testapp', args: ['web'], flags: {}}))
        .then(error => {
          expect(error.message).to.contain('Error: release command failed')
          expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content')
          expect(cli.stderr).to.contain('Releasing images web to testapp...')
          expect(cli.stderr).to.contain('Error: release command failed')
          expect(cli.stdout).to.contain('Running release command...')
          busl.done()
          stdMocks.restore()
        })
    })

    it('has release phase but no new release', () => {
      api
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
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {schemaVersion: 2, config: {digest: 'image_id'}})

      return cmd.run({app: 'testapp', args: ['web'], flags: {}})
        .then(() => expect(cli.stderr).to.contain('Releasing images web to testapp...'))
        .then(() => expect(cli.stderr).to.contain('done'))
        .then(() => expect(cli.stdout).to.equal(''))
    })
  })
})
