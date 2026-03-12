import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'

import DataPgAttachmentsIndex from '../../../../../../src/commands/data/pg/attachments/index.js'
import {
  addon,
  advancedCredentialsResponse,
  attachmentWithMissingNamespace,
  emptyAttachmentsResponse,
  multipleAttachmentsResponse,
  nonAdvancedAddon,
  singleAttachmentResponse,
} from '../../../../../fixtures/data/pg/fixtures.js'
import runCommand from '../../../../../helpers/runCommand.js'
import removeAllWhitespace from '../../../../../helpers/utils/remove-whitespaces.js'

describe('data:pg:attachments', function () {
  it('shows error for non-advanced databases', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [nonAdvancedAddon])

    try {
      await runCommand(DataPgAttachmentsIndex, [
        'DATABASE',
        '--app=myapp',
      ])
    } catch (error: unknown) {
      const err = error as Error

      herokuApi.done()
      expect(ansis.strip(err.message)).to.equal(
        'You can only use this command on Advanced-tier databases.\n'
         + 'Use heroku addons:info standard-database -a myapp instead.',
      )
    }
  })

  describe('when attachments exist', function () {
    it('displays single attachment information', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, singleAttachmentResponse)
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, advancedCredentialsResponse)

      await runCommand(DataPgAttachmentsIndex, ['DATABASE', '--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(stderr.output).to.equal('')
      const output = ansis.strip(removeAllWhitespace(stdout.output))
      expect(output).to.include(removeAllWhitespace('Attachments for ⛁ advanced-horizontal-01234'))
      expect(output).to.include(removeAllWhitespace('Attachment Credential Pool'))
      expect(output).to.include(removeAllWhitespace('myapp::DATABASE u2vi1nt40t3mcq (owner) leader'))
    })

    it('displays multiple attachments', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, multipleAttachmentsResponse)
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, advancedCredentialsResponse)

      await runCommand(DataPgAttachmentsIndex, ['DATABASE', '--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(stderr.output).to.equal('')
      const output = ansis.strip(removeAllWhitespace(stdout.output))
      expect(output).to.include(removeAllWhitespace('Attachments for ⛁ advanced-horizontal-01234'))
      expect(output).to.include(removeAllWhitespace('Attachment Credential Pool'))
      expect(output).to.include(removeAllWhitespace('myapp::DATABASE u2vi1nt40t3mcq (owner) leader'))
      expect(output).to.include(removeAllWhitespace('myapp::DATABASE_ANALYST analyst leader'))
      expect(output).to.include(removeAllWhitespace('myapp::DATABASE_ANALYTICS u2vi1nt40t3mcq (owner) analytics'))
    })

    it('handles missing namespace gracefully', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, attachmentWithMissingNamespace)

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, advancedCredentialsResponse)

      await runCommand(DataPgAttachmentsIndex, ['DATABASE', '--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(stderr.output).to.equal('')
      const output = ansis.strip(removeAllWhitespace(stdout.output))
      expect(output).to.include(removeAllWhitespace('Attachments for ⛁ advanced-horizontal-01234'))
      expect(output).to.include(removeAllWhitespace('Attachment Credential Pool'))
      expect(output).to.include(removeAllWhitespace('myapp::DATABASE u2vi1nt40t3mcq (owner) leader'))
    })
  })

  describe('when no attachments exist', function () {
    it('displays appropriate message for empty attachments', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, emptyAttachmentsResponse)

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, advancedCredentialsResponse)

      await runCommand(DataPgAttachmentsIndex, ['DATABASE', '--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(stderr.output).to.equal('')
      expect(ansis.strip(stdout.output)).to.equal('No attachments found for this database.\n')
    })
  })
})
