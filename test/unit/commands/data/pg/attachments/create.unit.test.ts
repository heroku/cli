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
  advancedCredentialsResponse,
  createAttachmentResponse,
  createCredentialAttachmentResponse,
  createForeignAttachmentResponse,
  nonAdvancedAddon,
  pgInfo,
  releasesResponse,
} from '../../../../../fixtures/data/pg/fixtures.js'

const heredoc = tsheredoc.default

describe('data:pg:attachments:create', function () {
  let resolveStub: SinonStub
  let promptStub: SinonStub

  beforeEach(function () {
    resolveStub = stub(utils.AddonResolver.prototype, 'resolve')
    promptStub = stub(DataPgAttachmentsCreate.prototype, 'prompt')
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
    it('creates a multi-factor attachment to the same app', async function () {
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, advancedCredentialsResponse)
        .get(`/data/postgres/v1/${addon.id}/info`)
        .reply(200, pgInfo)

      const herokuApi = nock('https://api.heroku.com')
        .post('/addon-attachments', {
          addon: {name: addon.name},
          app: {name: addon.app.name},
          name: 'TEST',
          namespace_config: {
            pool: 'leader',
            proxy: 'false',
            role: 'u2vi1nt40t3mcq',
          },
        })
        .reply(200, createAttachmentResponse)
        .get('/apps/myapp/releases')
        .reply(200, releasesResponse)

      resolveStub.withArgs('advanced-horizontal-01234', 'myapp', utils.pg.addonService())
        .resolves(addon)
      promptStub
        .onCall(0)
        .resolves({credential: 'u2vi1nt40t3mcq'})
        .onCall(1)
        .resolves({pool: 'leader'})

      const {stderr} = await runCommand(DataPgAttachmentsCreate, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--as=TEST',
      ])

      herokuApi.done()
      dataApi.done()
      expect(ansis.strip(stderr)).to.include(
        'Attaching advanced-horizontal-01234 with credential u2vi1nt40t3mcq and pool leader as TEST to ⬢ myapp... done',
      )
      expect(ansis.strip(stderr)).to.include(
        'Setting TEST config vars and restarting ⬢ myapp... done, v123',
      )
    })

    it('creates a foreign multi-factor attachment to a different app using the database name', async function () {
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, advancedCredentialsResponse)
        .get(`/data/postgres/v1/${addon.id}/info`)
        .reply(200, pgInfo)

      const herokuApi = nock('https://api.heroku.com')
        .post('/addon-attachments', {
          addon: {name: addon.name},
          app: {name: 'myapp2'},
          name: 'TEST2',
          namespace_config: {
            pool: 'leader',
            proxy: 'false',
            role: 'u2vi1nt40t3mcq',
          },
        })
        .reply(200, createForeignAttachmentResponse)
        .get('/apps/myapp2/releases')
        .reply(200, releasesResponse)

      resolveStub.withArgs('advanced-horizontal-01234', 'myapp2', utils.pg.addonService()).rejects(new HerokuAPIError({
        body: {id: 'not_found', message: 'Couldn\'t find that add on.', resource: 'add_on'},
        statusCode: 404,
      } as unknown as HTTPError))
      resolveStub.withArgs('advanced-horizontal-01234', undefined, utils.pg.addonService()).resolves(addon)
      promptStub
        .onCall(0)
        .resolves({credential: 'u2vi1nt40t3mcq'})
        .onCall(1)
        .resolves({pool: 'leader'})

      const {stderr} = await runCommand(DataPgAttachmentsCreate, [
        'advanced-horizontal-01234',
        '--app=myapp2',
        '--as=TEST2',
      ])

      herokuApi.done()
      dataApi.done()
      expect(ansis.strip(stderr)).to.include(
        'Attaching advanced-horizontal-01234 with credential u2vi1nt40t3mcq and pool leader as TEST2 to ⬢ myapp2... done',
      )
      expect(ansis.strip(stderr)).to.include(
        'Setting TEST2 config vars and restarting ⬢ myapp2... done, v123',
      )
    })

    it('creates a foreign multi-factor attachment to a different app using an app namespaced attachment name', async function () {
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, advancedCredentialsResponse)
        .get(`/data/postgres/v1/${addon.id}/info`)
        .reply(200, pgInfo)

      const herokuApi = nock('https://api.heroku.com')
        .post('/addon-attachments', {
          addon: {name: addon.name},
          app: {name: 'myapp2'},
          name: 'TEST2',
          namespace_config: {
            pool: 'leader',
            proxy: 'false',
            role: 'u2vi1nt40t3mcq',
          },
        })
        .reply(200, createForeignAttachmentResponse)
        .get('/apps/myapp2/releases')
        .reply(200, releasesResponse)

      resolveStub.withArgs('myapp::DATABASE', 'myapp2', utils.pg.addonService())
        .resolves(addon)
      promptStub
        .onCall(0)
        .resolves({credential: 'u2vi1nt40t3mcq'})
        .onCall(1)
        .resolves({pool: 'leader'})

      const {stderr} = await runCommand(DataPgAttachmentsCreate, [
        'myapp::DATABASE',
        '--app=myapp2',
        '--as=TEST2',
      ])

      herokuApi.done()
      dataApi.done()
      expect(ansis.strip(stderr)).to.include(
        'Attaching advanced-horizontal-01234 with credential u2vi1nt40t3mcq and pool leader as TEST2 to ⬢ myapp2... done',
      )
      expect(ansis.strip(stderr)).to.include(
        'Setting TEST2 config vars and restarting ⬢ myapp2... done, v123',
      )
    })

    it('creates a multi-factor attachment without a custom attachment name', async function () {
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, advancedCredentialsResponse)
        .get(`/data/postgres/v1/${addon.id}/info`)
        .reply(200, pgInfo)

      const herokuApi = nock('https://api.heroku.com')
        .post('/addon-attachments', {
          addon: {name: addon.name},
          app: {name: addon.app.name},
          namespace_config: {
            pool: 'leader',
            proxy: 'false',
            role: 'u2vi1nt40t3mcq',
          },
        })
        .reply(200, {
          ...createAttachmentResponse,
          name: 'HEROKU_POSTGRESQL_COBALT',
        })
        .get('/apps/myapp/releases')
        .reply(200, releasesResponse)

      resolveStub.withArgs('advanced-horizontal-01234', 'myapp', utils.pg.addonService())
        .resolves(addon)
      promptStub
        .onCall(0)
        .resolves({credential: 'u2vi1nt40t3mcq'})
        .onCall(1)
        .resolves({pool: 'leader'})
        .onCall(2)
        .resolves({attachmentName: ''})

      const {stderr} = await runCommand(DataPgAttachmentsCreate, [
        'advanced-horizontal-01234',
        '--app=myapp',
      ])

      herokuApi.done()
      dataApi.done()
      expect(ansis.strip(stderr)).to.include(
        'Attaching advanced-horizontal-01234 with credential u2vi1nt40t3mcq and pool leader to ⬢ myapp... done',
      )
      expect(ansis.strip(stderr)).to.include(
        'Setting HEROKU_POSTGRESQL_COBALT config vars and restarting ⬢ myapp... done, v123',
      )
    })

    it('creates a multi-factor attachment with a custom attachment name', async function () {
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, advancedCredentialsResponse)
        .get(`/data/postgres/v1/${addon.id}/info`)
        .reply(200, pgInfo)

      const herokuApi = nock('https://api.heroku.com')
        .post('/addon-attachments', {
          addon: {name: addon.name},
          app: {name: addon.app.name},
          name: 'MY_CUSTOM_NAME',
          namespace_config: {
            pool: 'leader',
            proxy: 'false',
            role: 'u2vi1nt40t3mcq',
          },
        })
        .reply(200, {
          ...createAttachmentResponse,
          name: 'MY_CUSTOM_NAME',
        })
        .get('/apps/myapp/releases')
        .reply(200, releasesResponse)

      resolveStub.withArgs('advanced-horizontal-01234', 'myapp', utils.pg.addonService())
        .resolves(addon)
      promptStub
        .onCall(0)
        .resolves({credential: 'u2vi1nt40t3mcq'})
        .onCall(1)
        .resolves({pool: 'leader'})
        .onCall(2)
        .resolves({attachmentName: 'MY_CUSTOM_NAME'})

      const {stderr} = await runCommand(DataPgAttachmentsCreate, [
        'advanced-horizontal-01234',
        '--app=myapp',
      ])

      herokuApi.done()
      dataApi.done()
      expect(ansis.strip(stderr)).to.include(
        'Attaching advanced-horizontal-01234 with credential u2vi1nt40t3mcq and pool leader as MY_CUSTOM_NAME to ⬢ myapp... done',
      )
      expect(ansis.strip(stderr)).to.include(
        'Setting MY_CUSTOM_NAME config vars and restarting ⬢ myapp... done, v123',
      )
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
          namespace_config: {
            pool: 'leader',
            proxy: 'false',
            role: 'u2vi1nt40t3mcq',
          },
        })
        .reply(500, {
          id: 'internal_server_error',
          message: 'Internal server error.',
        })

      resolveStub.withArgs('advanced-horizontal-01234', 'myapp', utils.pg.addonService())
        .resolves(addon)

      let stderr: string = ''
      try {
        ({stderr} = await runCommand(DataPgAttachmentsCreate, [
          'advanced-horizontal-01234',
          '--app=myapp',
          '--as=TEST',
          '--credential=u2vi1nt40t3mcq',
          '--pool=leader',
        ]))

      } catch (error: unknown) {
        const err = error as Error
        expect(resolveStub.callCount).to.equal(1)
        expect(ansis.strip(err.message)).to.equal(heredoc`
          Internal server error.

          Error ID: internal_server_error`)
      }

      herokuApi.done()
      expect(ansis.strip(stderr)).to.include(
        'Attaching advanced-horizontal-01234 with credential u2vi1nt40t3mcq and pool leader as TEST to ⬢ myapp... !',
      )
    })

    it('handles API errors gracefully on the release retrieval', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/addon-attachments', {
          addon: {name: addon.name},
          app: {name: addon.app.name},
          name: 'TEST',
          namespace_config: {
            pool: 'leader',
            proxy: 'false',
            role: 'u2vi1nt40t3mcq',
          },
        })
        .reply(200, createAttachmentResponse)
        .get('/apps/myapp/releases')
        .reply(500, {
          id: 'internal_server_error',
          message: 'Internal server error.',
        })

      resolveStub.withArgs('advanced-horizontal-01234', 'myapp', utils.pg.addonService())
        .resolves(addon)

      let stderr: string = ''
      try {
        ({stderr} = await runCommand(DataPgAttachmentsCreate, [
          'advanced-horizontal-01234',
          '--app=myapp',
          '--as=TEST',
          '--credential=u2vi1nt40t3mcq',
          '--pool=leader',
        ]))
      } catch (error: unknown) {
        const err = error as Error
        expect(resolveStub.callCount).to.equal(1)
        expect(ansis.strip(err.message)).to.equal(heredoc`
          Internal server error.

          Error ID: internal_server_error`)
      }

      herokuApi.done()
      expect(ansis.strip(stderr)).to.include(
        'Attaching advanced-horizontal-01234 with credential u2vi1nt40t3mcq and pool leader as TEST to ⬢ myapp... done',
      )
      expect(ansis.strip(stderr)).to.include(
        'Setting TEST config vars and restarting ⬢ myapp... !',
      )
    })
  })

  describe('non-interactive attachment creation', function () {
    it('creates a multi-factor attachment with the specified credential, pool and attachment name', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/addon-attachments', {
          addon: {name: addon.name},
          app: {name: addon.app.name},
          name: 'MYCREDENTIAL',
          namespace_config: {
            pool: 'mypool',
            proxy: 'false',
            role: 'mycredential',
          },
        })
        .reply(200, {
          ...createCredentialAttachmentResponse,
          name: 'MYCREDENTIAL',
          namespace: 'role:mycredential|proxy:false|pool:mypool',
        })
        .get('/apps/myapp/releases')
        .reply(200, releasesResponse)

      resolveStub.withArgs('advanced-horizontal-01234', 'myapp', utils.pg.addonService())
        .resolves(addon)

      const {stderr} = await runCommand(DataPgAttachmentsCreate, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--as=MYCREDENTIAL',
        '--credential=mycredential',
        '--pool=mypool',
      ])

      herokuApi.done()
      expect(ansis.strip(stderr)).to.include(
        'Attaching advanced-horizontal-01234 with credential mycredential and pool mypool as MYCREDENTIAL to ⬢ myapp... done',
      )
      expect(ansis.strip(stderr)).to.include(
        'Setting MYCREDENTIAL config vars and restarting ⬢ myapp... done, v123',
      )
    })
  })

  describe('error handling for missing credential or pool', function () {
    it('throws a specific error when credential doesn\'t exist', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/addon-attachments', {
          addon: {name: addon.name},
          app: {name: addon.app.name},
          name: 'MYCREDENTIAL',
          namespace_config: {
            pool: 'mypool',
            proxy: 'false',
            role: 'mycredential',
          },
        })
        .reply(503, { // We mock a 503 error because the Platform API is returning it, but it should be a 422 error.
          id: 'addon_error',
          message: 'We tried to namespace heroku-postgresql:advanced, but [...] include this message: invalid credential provided',
        })

      resolveStub.withArgs('advanced-horizontal-01234', 'myapp', utils.pg.addonService())
        .resolves(addon)

      try {
        await runCommand(DataPgAttachmentsCreate, [
          'advanced-horizontal-01234',
          '--app=myapp',
          '--as=MYCREDENTIAL',
          '--credential=mycredential',
          '--pool=mypool',
        ])
      } catch (error: unknown) {
        const err = error as Error

        expect(resolveStub.callCount).to.equal(1)
        expect(ansis.strip(err.message)).to.equal(
          'The credential mycredential doesn\'t exist on the database ⛁ advanced-horizontal-01234.\n'
          + 'Use heroku data:pg:credentials advanced-horizontal-01234 -a myapp '
          + 'to list the credentials on the database.')
      }

      herokuApi.done()
    })

    it('throws a specific error when pool doesn\'t exist', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/addon-attachments', {
          addon: {name: addon.name},
          app: {name: addon.app.name},
          name: 'MYCREDENTIAL',
          namespace_config: {
            pool: 'mypool',
            proxy: 'false',
            role: 'mycredential',
          },
        })
        .reply(503, { // We mock a 503 error because the Platform API is returning it, but it should be a 422 error.
          id: 'addon_error',
          message: 'We tried to namespace heroku-postgresql:advanced, but [...] include this message: invalid pool provided',
        })

      resolveStub.withArgs('advanced-horizontal-01234', 'myapp', utils.pg.addonService())
        .resolves(addon)

      try {
        await runCommand(DataPgAttachmentsCreate, [
          'advanced-horizontal-01234',
          '--app=myapp',
          '--as=MYCREDENTIAL',
          '--credential=mycredential',
          '--pool=mypool',
        ])
      } catch (error: unknown) {
        const err = error as Error

        expect(resolveStub.callCount).to.equal(1)
        expect(ansis.strip(err.message)).to.equal(
          'The pool mypool doesn\'t exist on the database ⛁ advanced-horizontal-01234.\n'
          + 'Use heroku data:pg:info advanced-horizontal-01234 -a myapp '
          + 'to list the pools on the database.')
      }

      herokuApi.done()
    })
  })
})
