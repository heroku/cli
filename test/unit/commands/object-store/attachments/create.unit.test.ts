import {HerokuAPIError} from '@heroku-cli/command'
import {runCommand} from '@heroku-cli/test-utils'
import {utils} from '@heroku/heroku-cli-util'
import {HTTPError} from '@heroku/http-call'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {restore, SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import ObjectStoreAttachmentsCreate from '../../../../../src/commands/object-store/attachments/create.js'
import {OBJECT_STORE_ADDON_SERVICE} from '../../../../../src/lib/object-store/addon.js'
import {
  addon,
  createAttachmentResponse,
  createForeignAttachmentResponse,
  releasesResponse,
} from '../../../../fixtures/object-store/fixtures.js'

const heredoc = tsheredoc.default

describe('object-store:attachments:create', function () {
  let resolveStub: SinonStub

  beforeEach(function () {
    resolveStub = stub(utils.AddonResolver.prototype, 'resolve')
  })

  afterEach(function () {
    restore()
  })

  it('attaches a credential to the same app', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/addon-attachments', {
        addon: {name: addon.name},
        app: {name: addon.app.name},
        name: 'REPORTS',
        namespace_config: {credential: 'reports'},
      })
      .reply(200, createAttachmentResponse)
      .get('/apps/myapp/releases')
      .reply(200, releasesResponse)

    resolveStub.withArgs('object-store-crystalline-01234', 'myapp', OBJECT_STORE_ADDON_SERVICE)
      .resolves(addon)

    const {stderr} = await runCommand(ObjectStoreAttachmentsCreate, [
      'object-store-crystalline-01234',
      '--app=myapp',
      '--as=REPORTS',
      '--credential=reports',
    ])

    herokuApi.done()
    expect(ansis.strip(stderr)).to.include('Attaching object-store-crystalline-01234 with credential reports as REPORTS to ⬢ myapp... done')
    expect(ansis.strip(stderr)).to.include('Setting REPORTS config vars and restarting ⬢ myapp... done, v123')
  })

  it('attaches a credential to a different app using the object store name', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/addon-attachments', {
        addon: {name: addon.name},
        app: {name: 'myapp2'},
        name: 'REPORTS2',
        namespace_config: {credential: 'reports'},
      })
      .reply(200, createForeignAttachmentResponse)
      .get('/apps/myapp2/releases')
      .reply(200, releasesResponse)

    resolveStub.withArgs('object-store-crystalline-01234', 'myapp2', OBJECT_STORE_ADDON_SERVICE).rejects(new HerokuAPIError({
      body: {id: 'not_found', message: 'Couldn\'t find that add on.', resource: 'add_on'},
      statusCode: 404,
    } as unknown as HTTPError))
    resolveStub.withArgs('object-store-crystalline-01234', undefined, OBJECT_STORE_ADDON_SERVICE).resolves(addon)

    const {stderr} = await runCommand(ObjectStoreAttachmentsCreate, [
      'object-store-crystalline-01234',
      '--app=myapp2',
      '--as=REPORTS2',
      '--credential=reports',
    ])

    herokuApi.done()
    expect(ansis.strip(stderr)).to.include('Attaching object-store-crystalline-01234 with credential reports as REPORTS2 to ⬢ myapp2... done')
    expect(ansis.strip(stderr)).to.include('Setting REPORTS2 config vars and restarting ⬢ myapp2... done, v123')
  })

  it('attaches without a custom attachment name', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/addon-attachments', {
        addon: {name: addon.name},
        app: {name: addon.app.name},
        namespace_config: {credential: 'reports'},
      })
      .reply(200, {
        ...createAttachmentResponse,
        name: 'OBJECT_STORE_REPORTS',
      })
      .get('/apps/myapp/releases')
      .reply(200, releasesResponse)

    resolveStub.withArgs('object-store-crystalline-01234', 'myapp', OBJECT_STORE_ADDON_SERVICE)
      .resolves(addon)

    const {stderr} = await runCommand(ObjectStoreAttachmentsCreate, [
      'object-store-crystalline-01234',
      '--app=myapp',
      '--credential=reports',
    ])

    herokuApi.done()
    expect(ansis.strip(stderr)).to.include('Attaching object-store-crystalline-01234 with credential reports to ⬢ myapp... done')
    expect(ansis.strip(stderr)).to.include('Setting OBJECT_STORE_REPORTS config vars and restarting ⬢ myapp... done, v123')
  })

  it('throws a specific error when the credential doesn\'t exist', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/addon-attachments', {
        addon: {name: addon.name},
        app: {name: addon.app.name},
        name: 'REPORTS',
        namespace_config: {credential: 'reports'},
      })
      .reply(503, { // Platform API surfaces the shogun rejection as a 503.
        id: 'addon_error',
        message: 'We tried to namespace heroku-object-store, but [...] include this message: invalid credential provided',
      })

    resolveStub.withArgs('object-store-crystalline-01234', 'myapp', OBJECT_STORE_ADDON_SERVICE)
      .resolves(addon)

    const {error} = await runCommand(ObjectStoreAttachmentsCreate, [
      'object-store-crystalline-01234',
      '--app=myapp',
      '--as=REPORTS',
      '--credential=reports',
    ])
    const err = error as Error

    expect(ansis.strip(err.message)).to.equal(heredoc`
      The credential reports doesn't exist on the object store object-store-crystalline-01234.
      Use heroku object-store:credentials object-store-crystalline-01234 -a myapp to list its credentials.`)
    herokuApi.done()
  })

  it('handles API errors gracefully on the add-on resolution', async function () {
    resolveStub.withArgs('object-store-crystalline-01234', 'myapp', OBJECT_STORE_ADDON_SERVICE)
      .rejects(new HerokuAPIError({
        body: {id: 'internal_server_error', message: 'Internal server error.', resource: 'add_on'},
        http: {statusCode: 500},
      } as unknown as HTTPError))

    const {error} = await runCommand(ObjectStoreAttachmentsCreate, [
      'object-store-crystalline-01234',
      '--app=myapp',
      '--credential=reports',
    ])
    const err = error as Error

    expect(resolveStub.callCount).to.equal(1)
    expect(ansis.strip(err.message)).to.equal(heredoc`
      Internal server error.

      Error ID: internal_server_error`)
  })

  it('handles API errors gracefully on the release retrieval', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/addon-attachments', {
        addon: {name: addon.name},
        app: {name: addon.app.name},
        name: 'REPORTS',
        namespace_config: {credential: 'reports'},
      })
      .reply(200, createAttachmentResponse)
      .get('/apps/myapp/releases')
      .reply(500, {
        id: 'internal_server_error',
        message: 'Internal server error.',
      })

    resolveStub.withArgs('object-store-crystalline-01234', 'myapp', OBJECT_STORE_ADDON_SERVICE)
      .resolves(addon)

    let stderr = ''
    try {
      ({stderr} = await runCommand(ObjectStoreAttachmentsCreate, [
        'object-store-crystalline-01234',
        '--app=myapp',
        '--as=REPORTS',
        '--credential=reports',
      ]))
    } catch (error: unknown) {
      const err = error as Error
      expect(ansis.strip(err.message)).to.equal(heredoc`
        Internal server error.

        Error ID: internal_server_error`)
    }

    herokuApi.done()
    expect(ansis.strip(stderr)).to.include('Attaching object-store-crystalline-01234 with credential reports as REPORTS to ⬢ myapp... done')
    expect(ansis.strip(stderr)).to.include('Setting REPORTS config vars and restarting ⬢ myapp... !')
  })
})
