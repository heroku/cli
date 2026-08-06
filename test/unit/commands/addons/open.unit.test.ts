import {runCommand} from '@heroku-cli/test-utils'
import {NotFoundError} from '@heroku/heroku-fetch'
import {AddonNotFoundError} from '@heroku/sdk/resources/platform/add-on'
import {expect} from 'chai'
import nock from 'nock'
import fs from 'node:fs/promises'
import path from 'node:path'
import {SinonStub, stub} from 'sinon'

import Cmd from '../../../../src/commands/addons/open.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

describe('The addons:open command', function () {
  let urlOpenerStub: SinonStub
  let sdkMock: MockSDK
  let describeAttachmentStub: SinonStub
  let resolveStub: SinonStub

  beforeEach(function () {
    urlOpenerStub = stub(Cmd, 'urlOpener').callsFake(async () => {})
    describeAttachmentStub = stub()
    resolveStub = stub()
    sdkMock = mockSDKPlatform({
      addOn: {describeAttachment: describeAttachmentStub, resolve: resolveStub},
    })
  })

  afterEach(function () {
    urlOpenerStub.reset()
    urlOpenerStub.restore()
    sdkMock.restore()
    nock.cleanAll()
  })

  it('should only print the url when --show-url is used', async function () {
    describeAttachmentStub.rejects(new AddonNotFoundError())
    resolveStub.resolves({id: 'db2', web_url: 'http://db2'})

    const {stdout} = await runCommand(Cmd, [
      '--app',
      'myApp',
      '--show-url',
      'db2',
    ])
    expect(stdout).to.equal('http://db2\n')
    expect(describeAttachmentStub.calledWith('myApp', 'db2')).to.be.true
    expect(resolveStub.calledWith('db2', {appIdentity: 'myApp'})).to.be.true
  })

  it('should open an attached addon, by slug, with the correct `context_app`.', async function () {
    // Restored pre-SDK intent: for a SHARED add-on attached to more than one
    // app, opening from a non-billing app must use that attachment's
    // context-scoped web_url — NOT the add-on's own (billing-app) dashboard.
    // Regression guard: the single describeAttachment call carries the
    // context-scoped web_url directly, so resolve must NOT be hit.
    describeAttachmentStub.resolves({
      addon: {app: {id: 'x'}, id: 'c7c9cf20-ec87-11e5-aea4-0002a5d5c51b'},
      web_url: 'http://myapp-2-slowdb',
    })

    const {stdout} = await runCommand(Cmd, [
      '--app',
      'myapp-2',
      'slowdb',
    ])
    expect(urlOpenerStub.calledWith('http://myapp-2-slowdb')).to.be.true
    expect(stdout).to.equal('Opening http://myapp-2-slowdb...\n')
    expect(describeAttachmentStub.calledWith('myapp-2', 'slowdb')).to.be.true
    expect(resolveStub.called).to.be.false
  })

  describe('should open the specified addon', function () {
    afterEach(function () {
      delete process.env.HEROKU_SUDO
    })

    it('url via the standard happy path.', async function () {
      describeAttachmentStub.resolves({web_url: 'https://heroku.com'})

      const {stdout} = await runCommand(Cmd, [
        '--app',
        'myApp',
        'redis-321',
      ])
      expect(urlOpenerStub.calledWith('https://heroku.com')).to.be.true
      expect(stdout).to.equal('Opening https://heroku.com...\n')
      // describeAttachment receives the raw addon arg and app — a single call.
      expect(describeAttachmentStub.calledWith('myApp', 'redis-321')).to.be.true
      expect(resolveStub.called).to.be.false
    })

    it('url when "::" exists in the addon_attachment.', async function () {
      describeAttachmentStub.resolves({web_url: 'https://heroku.com'})

      const {stdout} = await runCommand(Cmd, [
        '--app',
        'myApp',
        'redis::321',
      ])
      expect(urlOpenerStub.calledWith('https://heroku.com')).to.be.true
      expect(stdout).to.equal('Opening https://heroku.com...\n')
      expect(describeAttachmentStub.calledWith('myApp', 'redis::321')).to.be.true
      expect(resolveStub.called).to.be.false
    })

    it('falls back to resolve when the attachment has no web_url', async function () {
      // The source explicitly guards on `attachment?.web_url` — a null web_url
      // means we can't open a context-scoped dashboard, so resolve the add-on
      // for its own web_url.
      describeAttachmentStub.resolves({web_url: null})
      resolveStub.resolves({web_url: 'http://fallback'})

      const {stdout} = await runCommand(Cmd, [
        '--app',
        'myApp',
        '--show-url',
        'redis-321',
      ])
      expect(stdout).to.equal('http://fallback\n')
      expect(describeAttachmentStub.calledWith('myApp', 'redis-321')).to.be.true
      expect(resolveStub.calledWith('redis-321', {appIdentity: 'myApp'})).to.be.true
    })

    it('falls through to a direct resolve when describeAttachment throws a plain 404', async function () {
      // describeAttachment can surface a non-AddonNotFoundError 404 (statusCode
      // 404). isNotFound() must recognize it so we swallow it and resolve the
      // add-on directly rather than rethrowing.
      describeAttachmentStub.rejects(new NotFoundError(new Response('', {status: 404})))
      resolveStub.resolves({name: 'db2', web_url: 'http://db2'})

      const {stdout} = await runCommand(Cmd, [
        '--app',
        'myApp',
        '--show-url',
        'db2',
      ])
      expect(stdout).to.equal('http://db2\n')
      expect(resolveStub.calledWith('db2', {appIdentity: 'myApp'})).to.be.true
    })

    it('rethrows non-404 errors from describeAttachment', async function () {
      // Anything that is neither AddonNotFoundError nor a 404 must propagate.
      describeAttachmentStub.rejects(Object.assign(new Error('Boom'), {statusCode: 500}))

      const {error} = await runCommand(Cmd, [
        '--app',
        'myApp',
        '--show-url',
        'db2',
      ])
      expect(error?.message).to.equal('Boom')
      expect(resolveStub.called).to.be.false
    })

    it('url using sudo via sso.', async function () {
      process.env.HEROKU_SUDO = 'true'
      const api = nock('https://api.heroku.com:443')
        .get('/apps/myapp/addons/db2/sso')
        .reply(200, {action: 'exampleURL', method: 'get'})

      const {stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--show-url',
        'db2',
      ])
      expect(urlOpenerStub.calledWith('exampleURL')).to.be.true
      expect(stdout).to.equal('Opening exampleURL...\n')
      return api.done()
    })

    it('file path using sudo via sso.', async function () {
      process.env.HEROKU_SUDO = 'true'
      const api = nock('https://api.heroku.com:443')
        .get('/apps/myapp/addons/db2/sso')
        .reply(200, {action: 'exampleURL', method: 'post'})

      const {stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--show-url',
        'db2',
      ])
      const {lastArg} = urlOpenerStub.getCall(0)
      const normalizedPath = String(lastArg).replaceAll('/', path.sep)
      expect(lastArg.startsWith('file:')).to.be.true
      expect(stdout).to.equal(`Opening ${lastArg}...\n`)

      const file = await fs.readFile(normalizedPath.replace(`file:${path.sep}${path.sep}`, ''))
      expect(file.toString().includes('Opening db2 on myapp...')).to.be.true
      return api.done()
    })
  })
})
