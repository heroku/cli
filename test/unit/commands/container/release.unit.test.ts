import {runCommand} from '@heroku-cli/test-utils'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {NotAContainerAppError} from '@heroku/sdk/extensions/platform'
import {Errors} from '@oclif/core'
import {expect} from 'chai'
import nock from 'nock'
import {createSandbox, SinonSandbox, SinonStub} from 'sinon'

import Cmd from '../../../../src/commands/container/release.js'

type FakePlatform = {
  container: {
    ensureContainerStack: SinonStub
    releaseImages: SinonStub
  }
  release: {
    info: SinonStub
  }
}

function buildFakePlatform(sandbox: SinonSandbox): FakePlatform {
  return {
    container: {
      ensureContainerStack: sandbox.stub().resolves(),
      releaseImages: sandbox.stub().resolves({
        newRelease: {id: 'new-release', status: 'succeeded'},
        oldRelease: {id: 'old-release', status: 'succeeded'},
      }),
    },
    release: {
      info: sandbox.stub().resolves({status: 'succeeded'}),
    },
  }
}

describe('container release', function () {
  let fakePlatform: FakePlatform
  let sandbox: SinonSandbox

  beforeEach(function () {
    sandbox = createSandbox()
    fakePlatform = buildFakePlatform(sandbox)
    sandbox.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sandbox.restore()
  })

  it('has no process type specified', async function () {
    const {error, stdout} = await runCommand(Cmd, [
      '--app',
      'testapp',
    ])
    const {message} = error as unknown as Errors.CLIError
    expect(message).to.contain('Requires one or more process types')
    expect(stdout).to.equal('')
  })

  it('exits when the app stack is not "container"', async function () {
    fakePlatform.container.ensureContainerStack.rejects(new NotAContainerAppError({

      build_stack: {id: 'heroku-24', name: 'heroku-24'},
      id: 'app-id',
      name: 'testapp',
      stack: {id: 'heroku-24', name: 'heroku-24'},
    }))

    const {error} = await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ])

    const {message, oclif} = error as unknown as Errors.CLIError
    expect(message).to.equal(`This command is for Docker apps only. Switch stacks by running ${color.code('heroku stack:set container')}. Or, to deploy ${color.app('testapp')} with ${color.name('heroku-24')}, run ${color.code('git push heroku main')} instead.`)
    expect(oclif.exit).to.equal(1)
  })

  context('when HEROKU_HOST is set to an invalid domain', function () {
    let originalHost: string | undefined
    let registry: nock.Scope

    beforeEach(function () {
      originalHost = process.env.HEROKU_HOST
      process.env.HEROKU_HOST = 'attacker.com'
      registry = nock('https://registry.heroku.com:443')
    })

    afterEach(function () {
      if (originalHost === undefined) {
        delete process.env.HEROKU_HOST
      } else {
        process.env.HEROKU_HOST = originalHost
      }

      registry.done()
    })

    it('rejects invalid host and sends request to registry.heroku.com', async function () {
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'image_id'}, schemaVersion: 2})

      const {stderr} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])

      expect(stderr).to.contain("Invalid HEROKU_HOST 'attacker.com'")
    })
  })

  context('when the app is a container app', function () {
    let registry: nock.Scope

    beforeEach(function () {
      registry = nock('https://registry.heroku.com:443')
    })

    afterEach(function () {
      registry.done()
    })

    it('releases a single process type, no previous release', async function () {
      fakePlatform.container.releaseImages.resolves({
        newRelease: {id: 'release_id'},
        oldRelease: undefined,
      })
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'image_id'}, schemaVersion: 2})

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])
      expect(stderr).to.contain('Releasing images web to testapp... done')
      expect(stdout).to.equal('')
      expect(fakePlatform.container.releaseImages.calledOnce).to.equal(true)
    })

    it('releases a single process type, with a previous release', async function () {
      fakePlatform.container.releaseImages.resolves({
        newRelease: {id: 'release_id'},
        oldRelease: {id: 'old_release_id'},
      })
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'image_id'}, schemaVersion: 2})

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])
      expect(stderr).to.contain('Releasing images web to testapp... done')
      expect(stdout).to.equal('')
      expect(fakePlatform.container.releaseImages.calledOnce).to.equal(true)
    })

    it('retrieves data from a v1 schema version, no previous release', async function () {
      fakePlatform.container.releaseImages.resolves({
        newRelease: {id: 'release_id', status: 'succeeded'},
        oldRelease: undefined,
      })
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {history: [{v1Compatibility: '{"id":"image_id"}'}], schemaVersion: 1})

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])
      expect(stderr).to.contain('Releasing images web to testapp... done')
      expect(stdout).to.equal('')
      expect(fakePlatform.container.releaseImages.firstCall.args[1][0].docker_image).to.equal('image_id')
    })

    it('retrieves data from a v1 schema version, with a previous release', async function () {
      fakePlatform.container.releaseImages.resolves({
        newRelease: {id: 'release_id', status: 'succeeded'},
        oldRelease: {id: 'old_release_id', status: 'succeeded'},
      })
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {history: [{v1Compatibility: '{"id":"image_id"}'}], schemaVersion: 1})

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])
      expect(stderr).to.contain('Releasing images web to testapp... done')
      expect(stdout).to.equal('')
      expect(fakePlatform.container.releaseImages.firstCall.args[1][0].docker_image).to.equal('image_id')
    })

    it('releases multiple process types, no previous release', async function () {
      fakePlatform.container.releaseImages.resolves({
        newRelease: {id: 'release_id', status: 'succeeded'},
        oldRelease: undefined,
      })
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'web_image_id'}, schemaVersion: 2})
        .get('/v2/testapp/worker/manifests/latest')
        .reply(200, {config: {digest: 'worker_image_id'}, schemaVersion: 2})

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
        'worker',
      ])
      expect(stderr).to.contain('Releasing images web,worker to testapp... done')
      expect(stdout).to.equal('')
      expect(fakePlatform.container.releaseImages.firstCall.args[1]).to.deep.equal([
        {docker_image: 'web_image_id', type: 'web'},
        {docker_image: 'worker_image_id', type: 'worker'},
      ])
    })

    it('releases multiple process types, with a previous release', async function () {
      fakePlatform.container.releaseImages.resolves({
        newRelease: {id: 'release_id', status: 'succeeded'},
        oldRelease: {id: 'old_release_id', status: 'succeeded'},
      })
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'web_image_id'}, schemaVersion: 2})
        .get('/v2/testapp/worker/manifests/latest')
        .reply(200, {config: {digest: 'worker_image_id'}, schemaVersion: 2})

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
        'worker',
      ])
      expect(stderr).to.contain('Releasing images web,worker to testapp... done')
      expect(stdout).to.equal('')
      expect(fakePlatform.container.releaseImages.firstCall.args[1]).to.deep.equal([
        {docker_image: 'web_image_id', type: 'web'},
        {docker_image: 'worker_image_id', type: 'worker'},
      ])
    })

    it('releases with previous release and immediately successful release phase', async function () {
      fakePlatform.container.releaseImages.resolves({
        newRelease: {id: 'release_id', status: 'succeeded'},
        oldRelease: {id: 'old_release_id', status: 'succeeded'},
      })
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'image_id'}, schemaVersion: 2})

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])
      expect(stderr).to.contain('Releasing images web to testapp... done')
      expect(stdout).to.equal('')
    })

    it('releases with previous release and pending then successful release phase', async function () {
      const busl = nock('https://busl.test:443')
        .get('/streams/release.log')
        .reply(200, 'Release Output Content')
      fakePlatform.container.releaseImages.resolves({
        newRelease: {
          id: 'release_id',
          output_stream_url: 'https://busl.test/streams/release.log',
          status: 'pending',
        },
        oldRelease: {id: 'old_release_id', status: 'failed'},
      })
      fakePlatform.release.info.resolves({status: 'succeeded'})
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'image_id'}, schemaVersion: 2})

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])

      expect(stdout).to.contain('Running release command...')
      expect(stdout).to.contain('Release Output Content')
      expect(stderr).to.contain('Releasing images web to testapp...')
      expect(fakePlatform.release.info.calledOnceWith('testapp', 'release_id')).to.equal(true)

      busl.done()
    })

    it('releases with previous release and immediately failed release phase', async function () {
      fakePlatform.container.releaseImages.resolves({
        newRelease: {id: 'release_id', status: 'failed'},
        oldRelease: {id: 'old_release_id', status: 'succeeded'},
      })
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'image_id'}, schemaVersion: 2})

      const {error, stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])

      const {message, oclif} = error as unknown as Errors.CLIError
      expect(message).to.equal('Error: release command failed')
      expect(oclif.exit).to.equal(1)

      expect(stderr).to.contain('Releasing images web to testapp...')
      expect(stdout).to.equal('')
    })

    it('releases with previous release and pending then failed release phase', async function () {
      const busl = nock('https://busl.test:443')
        .get('/streams/release.log')
        .reply(200, 'Release Output Content')
      fakePlatform.container.releaseImages.resolves({
        newRelease: {
          id: 'release_id',
          output_stream_url: 'https://busl.test/streams/release.log',
          status: 'pending',
        },
        oldRelease: {id: 'old_release_id', status: 'succeeded'},
      })
      fakePlatform.release.info.resolves({status: 'failed'})
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'image_id'}, schemaVersion: 2})

      const {error, stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])

      const {message, oclif} = error as unknown as Errors.CLIError
      expect(message).to.equal('Error: release command failed')
      expect(oclif.exit).to.equal(1)

      expect(stdout).to.contain('Running release command...')
      expect(stdout).to.contain('Release Output Content')
      expect(stderr).to.contain('Releasing images web to testapp...')

      busl.done()
    })

    it('releases with no previous release and immediately successful release phase', async function () {
      fakePlatform.container.releaseImages.resolves({
        newRelease: {id: 'release_id', status: 'succeeded'},
        oldRelease: undefined,
      })
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'image_id'}, schemaVersion: 2})

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])
      expect(stderr).to.contain('Releasing images web to testapp... done')
      expect(stdout).to.equal('')
    })

    it('releases with no previous release and pending then successful release phase', async function () {
      const busl = nock('https://busl.test:443')
        .get('/streams/release.log')
        .reply(200, 'Release Output Content')
      fakePlatform.container.releaseImages.resolves({
        newRelease: {
          id: 'release_id',
          output_stream_url: 'https://busl.test/streams/release.log',
          status: 'pending',
        },
        oldRelease: undefined,
      })
      fakePlatform.release.info.resolves({status: 'succeeded'})
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'image_id'}, schemaVersion: 2})

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])

      expect(stdout).to.contain('Running release command...')
      expect(stdout).to.contain('Release Output Content')
      expect(stderr).to.contain('Releasing images web to testapp...')

      busl.done()
    })

    it('releases with no previous release and immediately failed release phase', async function () {
      fakePlatform.container.releaseImages.resolves({
        newRelease: {id: 'release_id', status: 'failed'},
        oldRelease: undefined,
      })
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'image_id'}, schemaVersion: 2})

      const {error, stderr} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])

      const {message, oclif} = error as unknown as Errors.CLIError
      expect(message).to.equal('Error: release command failed')
      expect(oclif.exit).to.equal(1)
      expect(stderr).to.contain('Releasing images web to testapp... done')
    })

    it('releases with no previous release and pending then failed release phase', async function () {
      const busl = nock('https://busl.test:443')
        .get('/streams/release.log')
        .reply(200, 'Release Output Content')
      fakePlatform.container.releaseImages.resolves({
        newRelease: {
          id: 'release_id',
          output_stream_url: 'https://busl.test/streams/release.log',
          status: 'pending',
        },
        oldRelease: undefined,
      })
      fakePlatform.release.info.resolves({status: 'failed'})
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'image_id'}, schemaVersion: 2})

      const {error, stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])

      const {message, oclif} = error as unknown as Errors.CLIError
      expect(message).to.equal('Error: release command failed')
      expect(oclif.exit).to.equal(1)
      expect(stdout).to.contain('Running release command...')
      expect(stdout).to.contain('Release Output Content')
      expect(stderr).to.contain('Releasing images web to testapp...')

      busl.done()
    })

    it('has release phase but no new release', async function () {
      fakePlatform.container.releaseImages.resolves({
        newRelease: {id: 'old_release_id', status: 'succeeded'},
        oldRelease: {id: 'old_release_id', status: 'succeeded'},
      })
      registry
        .get('/v2/testapp/web/manifests/latest')
        .reply(200, {config: {digest: 'image_id'}, schemaVersion: 2})

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])
      expect(stderr).to.not.contain('Running release command...')
      expect(stdout).to.equal('')
      expect(fakePlatform.release.info.called).to.equal(false)
    })
  })
})
