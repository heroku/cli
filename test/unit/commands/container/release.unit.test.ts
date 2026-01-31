import {color} from '@heroku/heroku-cli-util'
import {Errors} from '@oclif/core'
import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'
import stdMocks from 'std-mocks'
import {stderr, stdout} from 'stdout-stderr'

import Cmd from '../../../../src/commands/container/release.js'
import runCommand from '../../../helpers/runCommand.js'

describe('container release', function () {
  let api: nock.Scope
  let sandbox: sinon.SinonSandbox

  beforeEach(function () {
    api = nock('https://api.heroku.com:443')
    sandbox = sinon.createSandbox()
  })

  afterEach(function () {
    api.done()
    return sandbox.restore()
  })

  it('has no process type specified', async function () {
    let error
    await runCommand(Cmd, [
      '--app',
      'testapp',
    ]).catch((error_: any) => {
      error = error_
    })
    const {message} = error as unknown as Errors.CLIError
    expect(message).to.contain('Requires one or more process types')
    expect(stdout.output).to.equal('')
  })

  it('exits when the app stack is not "container"', async function () {
    let error
    api
      .get('/apps/testapp')
      .reply(200, {name: 'testapp', stack: {name: 'heroku-24'}})
    await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ]).catch((error_: any) => {
      error = error_
    })

    const {message, oclif} = error as unknown as Errors.CLIError
    expect(message).to.equal(`This command is for Docker apps only. Switch stacks by running ${color.code('heroku stack:set container')}. Or, to deploy ${color.app('testapp')} with ${color.name('heroku-24')}, run ${color.code('git push heroku main')} instead.`)
    expect(oclif.exit).to.equal(1)
  })

  context('when the app is a container app', function () {
    let registry: nock.Scope
    beforeEach(function () {
      api
        .get('/apps/testapp')
        .reply(200, {name: 'testapp', stack: {name: 'container'}})
      registry = nock('https://registry.heroku.com:443')
    })

    it('releases a single process type, no previous release', async function () {
      api
        .patch('/apps/testapp/formation', {
          updates: [
            {docker_image: 'image_id', type: 'web'},
          ],
        })
        .reply(200, {})
        .get('/apps/testapp/releases')
        .reply(200, [])
        .get('/apps/testapp/releases')
        .reply(200, [{id: 'release_id'}])
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'image_id'}, schemaVersion: 2})
      await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])
      expect(stderr.output).to.contain('Releasing images web to testapp... done')
      expect(stdout.output).to.equal('')
    })

    it('releases a single process type, with a previous release', async function () {
      api
        .patch('/apps/testapp/formation', {
          updates: [
            {docker_image: 'image_id', type: 'web'},
          ],
        })
        .reply(200, {})
        .get('/apps/testapp/releases')
        .reply(200, [{id: 'old_release_id'}])
        .get('/apps/testapp/releases')
        .reply(200, [{id: 'release_id'}])
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'image_id'}, schemaVersion: 2})
      await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])
      expect(stderr.output).to.contain('Releasing images web to testapp... done')
      expect(stdout.output).to.equal('')
    })

    it('retrieves data from a v1 schema version, no previous release', async function () {
      api
        .patch('/apps/testapp/formation', {
          updates: [
            {docker_image: 'image_id', type: 'web'},
          ],
        })
        .reply(200, {})
        .get('/apps/testapp/releases')
        .reply(200, [])
        .get('/apps/testapp/releases')
        .reply(200, [{id: 'release_id', status: 'succeeded'}])
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {history: [{v1Compatibility: '{"id":"image_id"}'}], schemaVersion: 1})
      await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])
      expect(stderr.output).to.contain('Releasing images web to testapp... done')
      expect(stdout.output).to.equal('')
    })

    it('retrieves data from a v1 schema version, with a previous release', async function () {
      api
        .patch('/apps/testapp/formation', {
          updates: [
            {docker_image: 'image_id', type: 'web'},
          ],
        })
        .reply(200, {})
        .get('/apps/testapp/releases')
        .reply(200, [{id: 'old_release_id', status: 'succeeded'}])
        .get('/apps/testapp/releases')
        .reply(200, [{id: 'release_id', status: 'succeeded'}])
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {history: [{v1Compatibility: '{"id":"image_id"}'}], schemaVersion: 1})
      await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])
      expect(stderr.output).to.contain('Releasing images web to testapp... done')
      expect(stdout.output).to.equal('')
    })

    it('releases multiple process types, no previous release', async function () {
      api
        .patch('/apps/testapp/formation', {
          updates: [
            {docker_image: 'web_image_id', type: 'web'}, {docker_image: 'worker_image_id', type: 'worker'},
          ],
        })
        .reply(200, {})
        .get('/apps/testapp/releases')
        .reply(200, [{id: 'old_release_id', status: 'succeeded'}])
        .get('/apps/testapp/releases')
        .reply(200, [{id: 'release_id', status: 'succeeded'}])
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'web_image_id'}, schemaVersion: 2})
        .get('/v2/testapp/worker/manifests/latest')
        .reply(200, {config: {digest: 'worker_image_id'}, schemaVersion: 2})
      await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
        'worker',
      ])
      expect(stderr.output).to.contain('Releasing images web,worker to testapp... done')
      expect(stdout.output).to.equal('')
    })

    it('releases multiple process types, with a previous release', async function () {
      api
        .patch('/apps/testapp/formation', {
          updates: [
            {docker_image: 'web_image_id', type: 'web'}, {docker_image: 'worker_image_id', type: 'worker'},
          ],
        })
        .reply(200, {})
        .get('/apps/testapp/releases')
        .reply(200, [{id: 'old_release_id', status: 'succeeded'}])
        .get('/apps/testapp/releases')
        .reply(200, [{id: 'release_id', status: 'succeeded'}])
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'web_image_id'}, schemaVersion: 2})
        .get('/v2/testapp/worker/manifests/latest')
        .reply(200, {config: {digest: 'worker_image_id'}, schemaVersion: 2})
      await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
        'worker',
      ])
      expect(stderr.output).to.contain('Releasing images web,worker to testapp... done')
      expect(stdout.output).to.equal('')
    })

    it('releases with previous release and immediately successful release phase', async function () {
      api
        .patch('/apps/testapp/formation', {
          updates: [
            {docker_image: 'image_id', type: 'web'},
          ],
        })
        .reply(200, {})
        .get('/apps/testapp/releases')
        .reply(200, [{id: 'old_release_id', status: 'succeeded'}])
        .get('/apps/testapp/releases')
        .reply(200, [{id: 'release_id', status: 'succeeded'}])
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'image_id'}, schemaVersion: 2})
      await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])
      expect(stdout.output).to.equal('')
      expect(stderr.output).to.contain('Releasing images web to testapp... done')
    })

    it('releases with previous release and pending then successful release phase', async function () {
      stdMocks.use()
      const busl = nock('https://busl.test:443')
        .get('/streams/release.log')
        .reply(200, 'Release Output Content')
      api
        .patch('/apps/testapp/formation', {
          updates: [
            {docker_image: 'image_id', type: 'web'},
          ],
        })
        .reply(200, {})
        .get('/apps/testapp/releases')
        .reply(200, [{id: 'old_release_id', status: 'failed'}])
        .get('/apps/testapp/releases')
        .reply(200, [{
          id: 'release_id',
          output_stream_url: 'https://busl.test/streams/release.log',
          status: 'pending',
        }])
        .get('/apps/testapp/releases/release_id')
        .reply(200, [{status: 'succeeded'}])
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'image_id'}, schemaVersion: 2})

      await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])

      expect(stdout.output).to.contain('Running release command...')
      expect(stdout.output).to.contain('Release Output Content')
      expect(stderr.output).to.contain('Releasing images web to testapp...')

      busl.done()
    })

    it('releases with previous release and immediately failed release phase', async function () {
      let error
      api
        .patch('/apps/testapp/formation', {
          updates: [
            {docker_image: 'image_id', type: 'web'},
          ],
        })
        .reply(200, {})
        .get('/apps/testapp/releases')
        .reply(200, [{id: 'old_release_id', status: 'succeeded'}])
        .get('/apps/testapp/releases')
        .reply(200, [{id: 'release_id', status: 'failed'}])
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'image_id'}, schemaVersion: 2})

      await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ]).catch((error_: any) => {
        error = error_
      })

      const {message, oclif} = error as unknown as Errors.CLIError
      expect(message).to.equal('Error: release command failed')
      expect(oclif.exit).to.equal(1)

      expect(stderr.output).to.contain('Releasing images web to testapp...')
      expect(stdout.output).to.equal('')
    })

    it('releases with previous release and pending then failed release phase', async function () {
      let error
      const busl = nock('https://busl.test:443')
        .get('/streams/release.log')
        .reply(200, 'Release Output Content')
      api
        .patch('/apps/testapp/formation', {
          updates: [
            {docker_image: 'image_id', type: 'web'},
          ],
        })
        .reply(200, {})
        .get('/apps/testapp/releases')
        .reply(200, [{id: 'old_release_id', status: 'succeeded'}])
        .get('/apps/testapp/releases')
        .reply(200, [{
          id: 'release_id',
          output_stream_url: 'https://busl.test/streams/release.log',
          status: 'pending',
        }])
        .get('/apps/testapp/releases/release_id')
        .reply(200, {status: 'failed'})
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'image_id'}, schemaVersion: 2})

      await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ]).catch((error_: any) => {
        error = error_
      })

      const {message, oclif} = error as unknown as Errors.CLIError
      expect(message).to.equal('Error: release command failed')
      expect(oclif.exit).to.equal(1)

      expect(stdout.output).to.contain('Running release command...')
      expect(stdout.output).to.contain('Release Output Content')
      expect(stderr.output).to.contain('Releasing images web to testapp...')

      busl.done()
    })

    it('releases with no previous release and immediately successful release phase', async function () {
      api
        .patch('/apps/testapp/formation', {
          updates: [
            {docker_image: 'image_id', type: 'web'},
          ],
        })
        .reply(200, {})
        .get('/apps/testapp/releases')
        .reply(200, [])
        .get('/apps/testapp/releases')
        .reply(200, [{status: 'succeeded'}])
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'image_id'}, schemaVersion: 2})

      await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])

      expect(stderr.output).to.contain('Releasing images web to testapp... done')
    })

    it('releases with no previous release and pending then successful release phase', async function () {
      const busl = nock('https://busl.test:443')
        .get('/streams/release.log')
        .reply(200, 'Release Output Content')
      api
        .patch('/apps/testapp/formation', {
          updates: [
            {docker_image: 'image_id', type: 'web'},
          ],
        })
        .reply(200, {})
        .get('/apps/testapp/releases')
        .reply(200, [])
        .get('/apps/testapp/releases')
        .reply(200, [{
          id: 'release_id',
          output_stream_url: 'https://busl.test/streams/release.log',
          status: 'pending',
        }])
        .get('/apps/testapp/releases/release_id')
        .reply(200, [{status: 'succeeded'}])
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'image_id'}, schemaVersion: 2})

      await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])

      expect(stdout.output).to.contain('Running release command...')
      expect(stdout.output).to.contain('Release Output Content')
      expect(stderr.output).to.contain('Releasing images web to testapp...')

      busl.done()
    })

    it('releases with no previous release and immediately failed release phase', async function () {
      let error
      api
        .patch('/apps/testapp/formation', {
          updates: [
            {docker_image: 'image_id', type: 'web'},
          ],
        })
        .reply(200, {})
        .get('/apps/testapp/releases')
        .reply(200, [])
        .get('/apps/testapp/releases')
        .reply(200, [{status: 'failed'}])
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'image_id'}, schemaVersion: 2})

      await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ]).catch((error_: any) => {
        error = error_
      })

      const {message, oclif} = error as unknown as Errors.CLIError
      expect(message).to.equal('Error: release command failed')
      expect(oclif.exit).to.equal(1)

      expect(stderr.output).to.contain('Releasing images web to testapp... done')
    })

    it('releases with no previous release and pending then failed release phase', async function () {
      let error
      const busl = nock('https://busl.test:443')
        .get('/streams/release.log')
        .reply(200, 'Release Output Content')
      api
        .patch('/apps/testapp/formation', {
          updates: [
            {docker_image: 'image_id', type: 'web'},
          ],
        })
        .reply(200, {})
        .get('/apps/testapp/releases')
        .reply(200, [])
        .get('/apps/testapp/releases')
        .reply(200, [{
          id: 'release_id',
          output_stream_url: 'https://busl.test/streams/release.log',
          status: 'pending',
        }])
        .get('/apps/testapp/releases/release_id')
        .reply(200, {status: 'failed'})
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'image_id'}, schemaVersion: 2})

      await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ]).catch((error_: any) => {
        error = error_
      })

      const {message, oclif} = error as unknown as Errors.CLIError
      expect(message).to.equal('Error: release command failed')
      expect(oclif.exit).to.equal(1)

      expect(stdout.output).to.contain('Running release command...')
      expect(stdout.output).to.contain('Release Output Content')
      expect(stderr.output).to.contain('Releasing images web to testapp...')

      busl.done()
    })

    it('has release phase but no new release', async function () {
      api
        .patch('/apps/testapp/formation', {
          updates: [
            {docker_image: 'image_id', type: 'web'},
          ],
        })
        .reply(200, {})
        .get('/apps/testapp/releases')
        .reply(200, [{id: 'old_release_id', status: 'succeeded'}])
        .get('/apps/testapp/releases')
        .reply(200, [{id: 'old_release_id', status: 'succeeded'}])
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'image_id'}, schemaVersion: 2})
      await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])
      expect(stderr.output).to.not.contain('Running release command...')
      expect(stdout.output).to.equal('')
    })
  })
})
