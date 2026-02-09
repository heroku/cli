import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import DataPgAttachmentsDestroy from '../../../../../../src/commands/data/pg/attachments/destroy.js'
import {
  addon,
  multipleAttachmentsResponse,
  nonAdvancedAddon,
  releasesResponse,
} from '../../../../../fixtures/data/pg/fixtures.js'
import runCommand from '../../../../../helpers/runCommand.js'

const heredoc = tsheredoc.default

describe('data:pg:attachments:destroy', function () {
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
      .post('/actions/addons/resolve')
      .reply(200, [nonAdvancedAddon])

    try {
      await runCommand(DataPgAttachmentsDestroy, [
        'DATABASE_ANALYST',
        '--app=myapp',
        '--confirm=myapp',
      ])
    } catch (error: unknown) {
      const err = error as Error

      herokuApi.done()
      expect(ansis.strip(err.message)).to.equal(
        'You can only use this command on Advanced-tier databases.\n'
         + 'Use heroku addons:detach DATABASE_ANALYST -a myapp instead.',
      )
    }
  })

  describe('basic attachment destruction', function () {
    it('destroys an attachment successfully', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments/DATABASE_ANALYST')
        .reply(200, multipleAttachmentsResponse[1])
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .delete('/addon-attachments/9a301cce-e1f7-4f1e-a955-5a0ab1d62cb4')
        .reply(200, multipleAttachmentsResponse[1])
        .get('/apps/myapp/releases')
        .reply(200, releasesResponse)

      await runCommand(DataPgAttachmentsDestroy, [
        'DATABASE_ANALYST',
        '--app=myapp',
        '--confirm=myapp',
      ])

      herokuApi.done()
      expect(ansis.strip(stderr.output)).to.equal(heredoc`
        Detaching DATABASE_ANALYST on ⛁ advanced-horizontal-01234 from ⬢ myapp... done
        Unsetting DATABASE_ANALYST config vars and restarting ⬢ myapp... done, v123
      `)
      expect(stdout.output).to.equal('')
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

      try {
        await runCommand(DataPgAttachmentsDestroy, [
          'NONEXISTENT',
          '--app=myapp',
          '--confirm=myapp',
        ])
      } catch (error: unknown) {
        const err = error as Error

        expect(err.message).to.equal(heredoc`
          Couldn't find that attachment.

          Error ID: not_found`,
        )
      }

      herokuApi.done()
    })

    it('handles API errors gracefully on the attachment destruction', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments/DATABASE_ANALYST')
        .reply(200, multipleAttachmentsResponse[1])
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .delete('/addon-attachments/9a301cce-e1f7-4f1e-a955-5a0ab1d62cb4')
        .reply(500, {
          id: 'internal_server_error',
          message: 'Internal server error.',
        })

      try {
        await runCommand(DataPgAttachmentsDestroy, [
          'DATABASE_ANALYST',
          '--app=myapp',
          '--confirm=myapp',
        ])
      } catch (error: unknown) {
        const err = error as Error
        expect(ansis.strip(err.message)).to.equal(heredoc`
          Internal server error.

          Error ID: internal_server_error`,
        )
      }

      herokuApi.done()
      expect(ansis.strip(stderr.output)).to.equal(heredoc`
        Detaching DATABASE_ANALYST on ⛁ advanced-horizontal-01234 from ⬢ myapp... !
      `)
    })

    it('handles API errors gracefully on the release retrieval', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments/DATABASE_ANALYST')
        .reply(200, multipleAttachmentsResponse[1])
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .delete('/addon-attachments/9a301cce-e1f7-4f1e-a955-5a0ab1d62cb4')
        .reply(200, multipleAttachmentsResponse[1])
        .get('/apps/myapp/releases')
        .reply(500, {
          id: 'internal_server_error',
          message: 'Internal server error.',
        })

      try {
        await runCommand(DataPgAttachmentsDestroy, [
          'DATABASE_ANALYST',
          '--app=myapp',
          '--confirm=myapp',
        ])
      } catch (error: unknown) {
        const err = error as Error
        expect(ansis.strip(err.message)).to.equal(heredoc`
          Internal server error.

          Error ID: internal_server_error`,
        )
      }

      herokuApi.done()
      expect(ansis.strip(stderr.output)).to.equal(heredoc`
        Detaching DATABASE_ANALYST on ⛁ advanced-horizontal-01234 from ⬢ myapp... done
        Unsetting DATABASE_ANALYST config vars and restarting ⬢ myapp... !
      `)
    })
  })
})
