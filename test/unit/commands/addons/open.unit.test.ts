import {runCommand} from '@heroku-cli/test-utils'
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
  let resolveByAttachmentStub: SinonStub
  let resolveStub: SinonStub
  let listByAddOnStub: SinonStub

  beforeEach(function () {
    urlOpenerStub = stub(Cmd, 'urlOpener').callsFake(async () => {})
    resolveByAttachmentStub = stub()
    resolveStub = stub()
    // Default to no attachments so the command falls back to the add-on's own
    // web_url; tests exercising the context-scoped URL override this.
    listByAddOnStub = stub().resolves([])
    sdkMock = mockSDKPlatform({
      addOn: {resolve: resolveStub, resolveByAttachment: resolveByAttachmentStub},
      addOnAttachment: {listByAddOn: listByAddOnStub},
    })
  })

  afterEach(function () {
    urlOpenerStub.reset()
    urlOpenerStub.restore()
    sdkMock.restore()
    nock.cleanAll()
  })

  it('should only print the url when --show-url is used', async function () {
    resolveByAttachmentStub.rejects(new AddonNotFoundError())
    resolveStub.resolves({id: 'db2', web_url: 'http://db2'})

    const {stdout} = await runCommand(Cmd, [
      '--app',
      'myApp',
      '--show-url',
      'db2',
    ])
    expect(stdout).to.equal('http://db2\n')
    expect(resolveByAttachmentStub.calledWith('myApp', 'db2')).to.be.true
    expect(resolveStub.calledWith('db2', {appIdentity: 'myApp'})).to.be.true
  })

  it('should open an attached addon, by slug, with the correct `context_app`.', async function () {
    // Restored pre-SDK intent: for a SHARED add-on attached to more than one
    // app, opening from a non-billing app must use that attachment's
    // context-scoped web_url — NOT the add-on's own (billing-app) dashboard.
    // Regression guard: reading web_url straight off the resolved add-on would
    // open http://myapp-slowdb (the billing app) instead of http://myapp-2-slowdb.
    resolveByAttachmentStub.resolves({id: 'c7c9cf20-ec87-11e5-aea4-0002a5d5c51b', name: 'slowdb'})
    resolveStub.resolves({id: 'c7c9cf20-ec87-11e5-aea4-0002a5d5c51b', name: 'slowdb', web_url: 'http://myapp-slowdb'})
    listByAddOnStub.resolves([
      {app: {name: 'myapp'}, web_url: 'http://myapp-slowdb'},
      {app: {name: 'myapp-2'}, web_url: 'http://myapp-2-slowdb'},
    ])

    const {stdout} = await runCommand(Cmd, [
      '--app',
      'myapp-2',
      'slowdb',
    ])
    expect(urlOpenerStub.calledWith('http://myapp-2-slowdb')).to.be.true
    expect(stdout).to.equal('Opening http://myapp-2-slowdb...\n')
    expect(resolveByAttachmentStub.calledWith('myapp-2', 'slowdb')).to.be.true
    expect(listByAddOnStub.calledWith('c7c9cf20-ec87-11e5-aea4-0002a5d5c51b')).to.be.true
  })

  describe('should open the specified addon', function () {
    afterEach(function () {
      delete process.env.HEROKU_SUDO
    })

    it('url via the standard happy path.', async function () {
      resolveByAttachmentStub.resolves({name: 'REDIS'})
      resolveStub.resolves({name: 'REDIS', web_url: 'https://heroku.com'})

      const {stdout} = await runCommand(Cmd, [
        '--app',
        'myApp',
        'redis-321',
      ])
      expect(urlOpenerStub.calledWith('https://heroku.com')).to.be.true
      expect(stdout).to.equal('Opening https://heroku.com...\n')
      expect(resolveByAttachmentStub.calledWith('myApp', 'redis-321')).to.be.true
      // Resolves by the attachment's add-on name, keeping the lookup scoped.
      expect(resolveStub.calledWith('REDIS', {appIdentity: 'myApp'})).to.be.true
    })

    it('url when "::" exists in the addon_attachment.', async function () {
      resolveByAttachmentStub.resolves({name: 'REDIS'})
      resolveStub.resolves({name: 'REDIS', web_url: 'https://heroku.com'})

      const {stdout} = await runCommand(Cmd, [
        '--app',
        'myApp',
        'redis::321',
      ])
      expect(urlOpenerStub.calledWith('https://heroku.com')).to.be.true
      expect(stdout).to.equal('Opening https://heroku.com...\n')
      expect(resolveByAttachmentStub.calledWith('myApp', 'redis::321')).to.be.true
    })

    it('resolves the add-on for its web_url even when resolveByAttachment omits it (regression: addons:open printed a blank line)', async function () {
      // The SDK's resolveByAttachment returns only the add-on identity
      // ({id, name, app}) — no web_url. Regression guard: the command must
      // NOT read web_url off the attachment (that yields undefined → blank
      // output); it must resolve the add-on to obtain the dashboard URL.
      resolveByAttachmentStub.resolves({app: {name: 'myApp'}, id: 'db-uuid', name: 'postgresql-rugged-40855'})
      resolveStub.resolves({name: 'postgresql-rugged-40855', web_url: 'https://addons-sso.heroku.com/apps/x/addons/y'})

      const {stdout} = await runCommand(Cmd, [
        '--app',
        'myApp',
        '--show-url',
        'postgresql-rugged-40855',
      ])
      expect(stdout).to.equal('https://addons-sso.heroku.com/apps/x/addons/y\n')
      expect(resolveByAttachmentStub.calledWith('myApp', 'postgresql-rugged-40855')).to.be.true
      expect(resolveStub.calledWith('postgresql-rugged-40855', {appIdentity: 'myApp'})).to.be.true
    })

    it('falls through to a direct resolve when resolveByAttachment throws a plain 404', async function () {
      // resolveByAttachment can surface a non-AddonNotFoundError 404 (statusCode
      // 404). isNotFound() must recognize it so we swallow it and resolve the
      // add-on directly rather than rethrowing.
      resolveByAttachmentStub.rejects(Object.assign(new Error('Not Found'), {statusCode: 404}))
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

    it('rethrows non-404 errors from resolveByAttachment', async function () {
      // Anything that is neither AddonNotFoundError nor a 404 must propagate.
      resolveByAttachmentStub.rejects(Object.assign(new Error('Boom'), {statusCode: 500}))

      const {error} = await runCommand(Cmd, [
        '--app',
        'myApp',
        '--show-url',
        'db2',
      ])
      expect(error?.message).to.equal('Boom')
      expect(resolveStub.called).to.be.false
    })

    it('falls back to the add-on web_url when no attachment matches the requested app', async function () {
      // The add-on has attachments, but none for the requested app (edge case:
      // resolved globally). Keep the add-on's own dashboard URL.
      resolveByAttachmentStub.rejects(new AddonNotFoundError())
      resolveStub.resolves({id: 'redis-uuid', name: 'REDIS', web_url: 'https://dashboard/REDIS'})
      listByAddOnStub.resolves([{app: {name: 'some-other-app'}, web_url: 'https://dashboard/other'}])

      const {stdout} = await runCommand(Cmd, [
        '--app',
        'myApp',
        '--show-url',
        'redis-321',
      ])
      expect(stdout).to.equal('https://dashboard/REDIS\n')
      expect(listByAddOnStub.calledWith('redis-uuid')).to.be.true
    })

    it('opens the add-on dashboard when listing its attachments 404s', async function () {
      // A 404 enumerating attachments must not block opening; fall back to the
      // add-on's own web_url.
      resolveByAttachmentStub.rejects(new AddonNotFoundError())
      resolveStub.resolves({id: 'redis-uuid', name: 'REDIS', web_url: 'https://dashboard/REDIS'})
      listByAddOnStub.rejects(Object.assign(new Error('Not Found'), {statusCode: 404}))

      const {stdout} = await runCommand(Cmd, [
        '--app',
        'myApp',
        '--show-url',
        'redis-321',
      ])
      expect(stdout).to.equal('https://dashboard/REDIS\n')
    })

    it('rethrows non-404 errors raised while listing attachments', async function () {
      resolveByAttachmentStub.rejects(new AddonNotFoundError())
      resolveStub.resolves({id: 'redis-uuid', name: 'REDIS', web_url: 'https://dashboard/REDIS'})
      listByAddOnStub.rejects(Object.assign(new Error('Boom'), {statusCode: 500}))

      const {error} = await runCommand(Cmd, [
        '--app',
        'myApp',
        '--show-url',
        'redis-321',
      ])
      expect(error?.message).to.equal('Boom')
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
