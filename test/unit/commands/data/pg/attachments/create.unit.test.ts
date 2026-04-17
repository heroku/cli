import {HerokuAPIError} from '@heroku-cli/command'
import {runCommand} from '@heroku-cli/test-utils'
import {utils} from '@heroku/heroku-cli-util'
import {HTTPError} from '@heroku/http-call'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {restore, SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import DataPgAttachmentsCreate from '../../../../../../src/commands/data/pg/attachments/create.js'
import {
  addon,
  createAttachmentResponse,
  createCredentialAttachmentResponse,
  createForeignAttachmentResponse,
  createPoolAttachmentResponse,
  credentialConfigResponse,
  nonAdvancedAddon,
  poolConfigResponse,
  releasesResponse,
} from '../../../../../fixtures/data/pg/fixtures.js'

const heredoc = tsheredoc.default

describe('data:pg:attachments:create', function () {
  let resolveStub: SinonStub

  beforeEach(function () {
    resolveStub = stub(utils.AddonResolver.prototype, 'resolve')
  })

  afterEach(function () {
    restore()
  })

  it('shows error for non-advanced databases', async function () {
    resolveStub.withArgs('advanced-horizontal-01234', 'myapp', utils.pg.addonService())
      .resolves(nonAdvancedAddon)

    const {error} = await runCommand(DataPgAttachmentsCreate, [
      'advanced-horizontal-01234',
      '--app=myapp',
      '--as=TEST',
    ])
    const err = error as Error

    expect(ansis.strip(err.message)).to.equal('You can only use this command on Advanced-tier databases.\n'
         + 'Use heroku addons:attach standard-database -a myapp --as TEST instead.')
  })

  describe('basic attachment creation', function () {
    it('creates a basic attachment to the same app', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/addon-attachments', {
          addon: {name: addon.name},
          app: {name: addon.app.name},
          name: 'TEST',
        })
        .reply(200, createAttachmentResponse)
        .get('/apps/myapp/releases')
        .reply(200, releasesResponse)
      resolveStub.withArgs('advanced-horizontal-01234', 'myapp', utils.pg.addonService())
        .resolves(addon)

      const {stderr} = await runCommand(DataPgAttachmentsCreate, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--as=TEST',
      ])

      herokuApi.done()
      expect(ansis.strip(stderr)).to.equal(heredoc`
        Attaching advanced-horizontal-01234 as TEST to ⬢ myapp... done
        Setting TEST config vars and restarting ⬢ myapp... done, v123
      `)
    })

    it('creates a basic (foreign) attachment to a different app using the database name', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/addon-attachments', {
          addon: {name: addon.name},
          app: {name: 'myapp2'},
          name: 'TEST2',
        })
        .reply(200, createForeignAttachmentResponse)
        .get('/apps/myapp2/releases')
        .reply(200, releasesResponse)
      resolveStub.withArgs('advanced-horizontal-01234', 'myapp2', utils.pg.addonService()).rejects(new HerokuAPIError({
        body: {id: 'not_found', message: 'Couldn\'t find that add on.', resource: 'add_on'},
        statusCode: 404,
      } as unknown as HTTPError))
      resolveStub.withArgs('advanced-horizontal-01234', undefined, utils.pg.addonService()).resolves(addon)

      const {stderr} = await runCommand(DataPgAttachmentsCreate, [
        'advanced-horizontal-01234',
        '--app=myapp2',
        '--as=TEST2',
      ])

      herokuApi.done()
      expect(ansis.strip(stderr)).to.equal(heredoc`
        Attaching advanced-horizontal-01234 as TEST2 to ⬢ myapp2... done
        Setting TEST2 config vars and restarting ⬢ myapp2... done, v123
      `)
    })

    it('creates a basic (foreign) attachment to a different app using an app namespaced attachment name', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/addon-attachments', {
          addon: {name: addon.name},
          app: {name: 'myapp2'},
          name: 'TEST2',
        })
        .reply(200, createForeignAttachmentResponse)
        .get('/apps/myapp2/releases')
        .reply(200, releasesResponse)
      resolveStub.withArgs('myapp::DATABASE', 'myapp2', utils.pg.addonService())
        .resolves(addon)

      const {stderr} = await runCommand(DataPgAttachmentsCreate, [
        'myapp::DATABASE',
        '--app=myapp2',
        '--as=TEST2',
      ])

      herokuApi.done()
      expect(ansis.strip(stderr)).to.equal(heredoc`
        Attaching advanced-horizontal-01234 as TEST2 to ⬢ myapp2... done
        Setting TEST2 config vars and restarting ⬢ myapp2... done, v123
      `)
    })

    it('creates a basic attachment without a custom attachment name', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/addon-attachments', {
          addon: {name: addon.name},
          app: {name: addon.app.name},
        })
        .reply(200, {
          ...createAttachmentResponse,
          name: 'HEROKU_POSTGRESQL_COBALT',
        })
        .get('/apps/myapp/releases')
        .reply(200, releasesResponse)
      resolveStub.withArgs('advanced-horizontal-01234', 'myapp', utils.pg.addonService())
        .resolves(addon)

      const {stderr} = await runCommand(DataPgAttachmentsCreate, [
        'advanced-horizontal-01234',
        '--app=myapp',
      ])

      herokuApi.done()
      expect(ansis.strip(stderr)).to.equal(heredoc`
        Attaching advanced-horizontal-01234 to ⬢ myapp... done
        Setting HEROKU_POSTGRESQL_COBALT config vars and restarting ⬢ myapp... done, v123
      `)
    })

    it('handles API errors gracefully on the add-on resolution', async function () {
      resolveStub.withArgs('advanced-horizontal-01234', 'myapp', utils.pg.addonService())
        .rejects(new HerokuAPIError({
          body: {id: 'internal_server_error', message: 'Internal server error.', resource: 'add_on'},
          http: {statusCode: 500},
        } as unknown as HTTPError))

      const {error} = await runCommand(DataPgAttachmentsCreate, [
        'advanced-horizontal-01234',
        '--app=myapp',
      ])
      const err = error as Error
      expect(resolveStub.callCount).to.equal(1)
      expect(ansis.strip(err.message)).to.equal(heredoc`
          Internal server error.

          Error ID: internal_server_error`)
    })

    it('handles API errors gracefully if the add-on doesn\'t exist', async function () {
      resolveStub.withArgs('advanced-horizontal-01234', 'myapp', utils.pg.addonService()).rejects(new HerokuAPIError({
        body: {id: 'not_found', message: 'Couldn\'t find that add on.', resource: 'add_on'},
        statusCode: 404,
      } as unknown as HTTPError))
      resolveStub.withArgs('advanced-horizontal-01234', undefined, utils.pg.addonService()).rejects(new HerokuAPIError({
        body: {id: 'not_found', message: 'Couldn\'t find that add on.', resource: 'add_on'},
        statusCode: 404,
      } as unknown as HTTPError))

      const {error} = await runCommand(DataPgAttachmentsCreate, [
        'advanced-horizontal-01234',
        '--app=myapp',
      ])
      const err = error as Error
      expect(resolveStub.callCount).to.equal(2)
      expect(ansis.strip(err.message)).to.equal(heredoc`
          Couldn't find that add on.

          Error ID: not_found`)
    })

    it('handles API errors gracefully on the attachment creation', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/addon-attachments', {
          addon: {name: addon.name},
          app: {name: addon.app.name},
          name: 'TEST',
        })
        .reply(500, {
          id: 'internal_server_error',
          message: 'Internal server error.',
        })
      resolveStub.withArgs('advanced-horizontal-01234', 'myapp', utils.pg.addonService())
        .resolves(addon)

      const {error, stderr} = await runCommand(DataPgAttachmentsCreate, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--as=TEST',
      ])
      const err = error as Error
      expect(resolveStub.callCount).to.equal(1)
      expect(ansis.strip(err.message)).to.equal(heredoc`
        Internal server error.

        Error ID: internal_server_error`)

      herokuApi.done()
      expect(ansis.strip(stderr)).to.equal(heredoc`
        Attaching advanced-horizontal-01234 as TEST to ⬢ myapp... !
      `)
    })

    it('handles API errors gracefully on the release retrieval', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/addon-attachments', {
          addon: {name: addon.name},
          app: {name: addon.app.name},
          name: 'TEST',
        })
        .reply(200, createAttachmentResponse)
        .get('/apps/myapp/releases')
        .reply(500, {
          id: 'internal_server_error',
          message: 'Internal server error.',
        })
      resolveStub.withArgs('advanced-horizontal-01234', 'myapp', utils.pg.addonService())
        .resolves(addon)

      const {error, stderr} = await runCommand(DataPgAttachmentsCreate, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--as=TEST',
      ])
      const err = error as Error
      expect(resolveStub.callCount).to.equal(1)
      expect(ansis.strip(err.message)).to.equal(heredoc`
        Internal server error.

        Error ID: internal_server_error`)

      herokuApi.done()
      expect(ansis.strip(stderr)).to.equal(heredoc`
        Attaching advanced-horizontal-01234 as TEST to ⬢ myapp... done
        Setting TEST config vars and restarting ⬢ myapp... !
      `)
    })
  })

  describe('credential-based attachment', function () {
    it('creates attachment with credential', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get(`/addons/${addon.name}/config/role:mycredential`)
        .reply(200, credentialConfigResponse)
        .post('/addon-attachments', {
          addon: {name: addon.name},
          app: {name: addon.app.name},
          name: 'MYCREDENTIAL',
          namespace: 'role:mycredential',
        })
        .reply(200, createCredentialAttachmentResponse)
        .get('/apps/myapp/releases')
        .reply(200, releasesResponse)
      resolveStub.withArgs('advanced-horizontal-01234', 'myapp', utils.pg.addonService())
        .resolves(addon)

      const {stderr} = await runCommand(DataPgAttachmentsCreate, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--as=MYCREDENTIAL',
        '--credential=mycredential',
      ])

      herokuApi.done()
      expect(ansis.strip(stderr)).to.equal(heredoc`
        Attaching mycredential on advanced-horizontal-01234 as MYCREDENTIAL to ⬢ myapp... done
        Setting MYCREDENTIAL config vars and restarting ⬢ myapp... done, v123
      `)
    })

    it('throws error when credential does not exist', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get(`/addons/${addon.name}/config/role:nonexistent`)
        .reply(200, [])
      resolveStub.withArgs('advanced-horizontal-01234', 'myapp', utils.pg.addonService())
        .resolves(addon)

      const {error} = await runCommand(DataPgAttachmentsCreate, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--credential=nonexistent',
      ])
      const err = error as Error

      expect(resolveStub.callCount).to.equal(1)
      expect(ansis.strip(err.message)).to.equal('The credential nonexistent doesn\'t exist on the database ⛁ advanced-horizontal-01234.\n'
          + 'Use heroku data:pg:credentials advanced-horizontal-01234 -a myapp '
          + 'to list the credentials on the database.')

      herokuApi.done()
    })
  })

  describe('pool-based attachment', function () {
    it('creates attachment with pool', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get(`/addons/${addon.name}/config/pool:mypool`)
        .reply(200, poolConfigResponse)
        .post('/addon-attachments', {
          addon: {name: addon.name},
          app: {name: addon.app.name},
          name: 'MYPOOL',
          namespace: 'pool:mypool',
        })
        .reply(200, createPoolAttachmentResponse)
        .get('/apps/myapp/releases')
        .reply(200, releasesResponse)
      resolveStub.withArgs('advanced-horizontal-01234', 'myapp', utils.pg.addonService())
        .resolves(addon)

      const {stderr} = await runCommand(DataPgAttachmentsCreate, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--as=MYPOOL',
        '--pool=mypool',
      ])

      herokuApi.done()
      expect(ansis.strip(stderr)).to.equal(heredoc(`
        Attaching mypool on advanced-horizontal-01234 as MYPOOL to ⬢ myapp... done
        Setting MYPOOL config vars and restarting ⬢ myapp... done, v123
      `))
    })

    it('throws error when pool does not exist', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get(`/addons/${addon.name}/config/pool:nonexistent`)
        .reply(200, [])
      resolveStub.withArgs('advanced-horizontal-01234', 'myapp', utils.pg.addonService())
        .resolves(addon)

      const {error} = await runCommand(DataPgAttachmentsCreate, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--pool=nonexistent',
      ])
      const err = error as Error

      expect(resolveStub.callCount).to.equal(1)
      expect(ansis.strip(err.message)).to.equal('The pool nonexistent doesn\'t exist on the database ⛁ advanced-horizontal-01234.\n'
          + 'Use heroku data:pg:info advanced-horizontal-01234 -a myapp '
          + 'to list the pools on the database.')

      herokuApi.done()
    })
  })
})
