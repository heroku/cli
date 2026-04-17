import {runCommand} from '@heroku-cli/test-utils'
import {utils} from '@heroku/heroku-cli-util'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {restore, SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import DataPgAttachmentsDestroy from '../../../../../../src/commands/data/pg/attachments/destroy.js'
import {
  addon,
  multipleAttachmentsResponse,
  nonAdvancedAddon,
  releasesResponse,
} from '../../../../../fixtures/data/pg/fixtures.js'

const heredoc = tsheredoc.default

describe('data:pg:attachments:destroy', function () {
  let resolveStub: SinonStub

  beforeEach(function () {
    resolveStub = stub(utils.AddonResolver.prototype, 'resolve')
  })

  afterEach(function () {
    restore()
  })

  it('shows error for non-advanced databases', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments/DATABASE_ANALYST')
      .reply(200, {
        ...multipleAttachmentsResponse[1],
        addon: {
          app: {
            id: nonAdvancedAddon.app.id,
            name: nonAdvancedAddon.app.name,
          },
          id: nonAdvancedAddon.id,
          name: nonAdvancedAddon.name,
        },
      })
    resolveStub.withArgs(nonAdvancedAddon.name, undefined, utils.pg.addonService())
      .resolves(nonAdvancedAddon)

    const {error} = await runCommand(DataPgAttachmentsDestroy, [
      'DATABASE_ANALYST',
      '--app=myapp',
      '--confirm=myapp',
    ])
    const err = error as Error

    herokuApi.done()
    expect(ansis.strip(err.message)).to.equal('You can only use this command on Advanced-tier databases.\n'
         + 'Use heroku addons:detach DATABASE_ANALYST -a myapp instead.')
  })

  describe('basic attachment destruction', function () {
    it('destroys an attachment successfully', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments/DATABASE_ANALYST')
        .reply(200, multipleAttachmentsResponse[1])
        .delete('/addon-attachments/9a301cce-e1f7-4f1e-a955-5a0ab1d62cb4')
        .reply(200, multipleAttachmentsResponse[1])
        .get('/apps/myapp/releases')
        .reply(200, releasesResponse)
      resolveStub.withArgs(addon.name, undefined, utils.pg.addonService())
        .resolves(addon)

      const {stderr, stdout} = await runCommand(DataPgAttachmentsDestroy, [
        'DATABASE_ANALYST',
        '--app=myapp',
        '--confirm=myapp',
      ])

      herokuApi.done()
      expect(ansis.strip(stderr)).to.equal(heredoc`
        Detaching DATABASE_ANALYST on ⛁ advanced-horizontal-01234 from ⬢ myapp... done
        Unsetting DATABASE_ANALYST config vars and restarting ⬢ myapp... done, v123
      `)
      expect(stdout).to.equal('')
    })
  })

  describe('error handling', function () {
    it('handles attachment not found error', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments/NONEXISTENT')
        .reply(404, {
          id: 'not_found',
          message: 'Couldn\'t find that attachment.',
          resource: 'attachment',
        })

      const {error} = await runCommand(DataPgAttachmentsDestroy, [
        'NONEXISTENT',
        '--app=myapp',
        '--confirm=myapp',
      ])
      const err = error as Error

      expect(err.message).to.equal(heredoc`
          Couldn't find that attachment.

          Error ID: not_found`)

      herokuApi.done()
    })

    it('handles API errors gracefully on the attachment destruction', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments/DATABASE_ANALYST')
        .reply(200, multipleAttachmentsResponse[1])
        .delete('/addon-attachments/9a301cce-e1f7-4f1e-a955-5a0ab1d62cb4')
        .reply(500, {
          id: 'internal_server_error',
          message: 'Internal server error.',
        })
      resolveStub.withArgs(addon.name, undefined, utils.pg.addonService())
        .resolves(addon)

      const {error, stderr} = await runCommand(DataPgAttachmentsDestroy, [
        'DATABASE_ANALYST',
        '--app=myapp',
        '--confirm=myapp',
      ])
      const err = error as Error
      expect(ansis.strip(err.message)).to.equal(heredoc`
        Internal server error.

        Error ID: internal_server_error`)

      herokuApi.done()
      expect(ansis.strip(stderr)).to.equal(heredoc`
        Detaching DATABASE_ANALYST on ⛁ advanced-horizontal-01234 from ⬢ myapp... !
      `)
    })

    it('handles API errors gracefully on the release retrieval', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments/DATABASE_ANALYST')
        .reply(200, multipleAttachmentsResponse[1])
        .delete('/addon-attachments/9a301cce-e1f7-4f1e-a955-5a0ab1d62cb4')
        .reply(200, multipleAttachmentsResponse[1])
        .get('/apps/myapp/releases')
        .reply(500, {
          id: 'internal_server_error',
          message: 'Internal server error.',
        })
      resolveStub.withArgs(addon.name, undefined, utils.pg.addonService())
        .resolves(addon)

      const {error, stderr} = await runCommand(DataPgAttachmentsDestroy, [
        'DATABASE_ANALYST',
        '--app=myapp',
        '--confirm=myapp',
      ])
      const err = error as Error
      expect(ansis.strip(err.message)).to.equal(heredoc`
        Internal server error.

        Error ID: internal_server_error`)

      herokuApi.done()
      expect(ansis.strip(stderr)).to.equal(heredoc`
        Detaching DATABASE_ANALYST on ⛁ advanced-horizontal-01234 from ⬢ myapp... done
        Unsetting DATABASE_ANALYST config vars and restarting ⬢ myapp... !
      `)
    })
  })
})
