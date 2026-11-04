import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {NotAdvancedDatabaseError} from '@heroku/sdk/resources/data/postgres-database'
import ansis from 'ansis'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'

import DataPgAttachmentsIndex from '../../../../../../src/commands/data/pg/attachments/index.js'
import {
  addon,
  advancedCredentialsResponse,
  attachmentWithMissingNamespace,
  emptyAttachmentsResponse,
  multipleAttachmentsMultiFactorResponse,
  multipleAttachmentsResponse,
  nonAdvancedAddon,
  singleAttachmentResponse,
} from '../../../../../fixtures/data/pg/fixtures.js'
import removeAllWhitespace from '../../../../../helpers/utils/remove-whitespaces.js'

type FakeData = {
  postgresDatabase: {listAttachments: SinonStub}
}

function buildFakeData(): FakeData {
  return {postgresDatabase: {listAttachments: stub()}}
}

// The command delegates resolution + the credentials/attachments fan-out to
// the resolving `data.postgresDatabase.listAttachments`, which returns the
// credential array (the SDK unwraps the `{items}` envelope) alongside the
// resolved add-on and its attachments.
const credentials = advancedCredentialsResponse.items

describe('data:pg:attachments', function () {
  let fakeData: FakeData

  beforeEach(function () {
    fakeData = buildFakeData()
    stub(HerokuSDK.prototype, 'data').get(() => fakeData)
  })

  afterEach(function () {
    restore()
  })

  it('shows error for non-advanced databases', async function () {
    fakeData.postgresDatabase.listAttachments.rejects(new NotAdvancedDatabaseError(nonAdvancedAddon, 'not advanced'))

    const {error} = await runCommand(DataPgAttachmentsIndex, [
      'DATABASE',
      '--app=myapp',
    ])
    const err = error as Error

    expect(ansis.strip(err.message)).to.equal('You can only use this command on Advanced-tier databases.\n'
         + 'Use heroku addons:info standard-database -a myapp instead.')
    expect(fakeData.postgresDatabase.listAttachments.calledOnceWithExactly('DATABASE', {appIdentity: 'myapp'})).to.equal(true)
  })

  describe('when attachments exist', function () {
    it('displays single attachment information', async function () {
      fakeData.postgresDatabase.listAttachments.resolves({addon, attachments: singleAttachmentResponse, credentials})

      const {stderr, stdout} = await runCommand(DataPgAttachmentsIndex, ['DATABASE', '--app=myapp'])

      expect(stderr).to.equal('')
      const output = ansis.strip(removeAllWhitespace(stdout))
      expect(output).to.include(removeAllWhitespace('Attachments for ⛁ advanced-horizontal-01234'))
      expect(output).to.include(removeAllWhitespace('Attachment Credential Pool'))
      expect(output).to.include(removeAllWhitespace('myapp::DATABASE u2vi1nt40t3mcq (owner) leader'))
      expect(fakeData.postgresDatabase.listAttachments.calledOnceWithExactly('DATABASE', {appIdentity: 'myapp'})).to.equal(true)
    })

    it('displays multiple attachments', async function () {
      fakeData.postgresDatabase.listAttachments.resolves({addon, attachments: multipleAttachmentsResponse, credentials})

      const {stderr, stdout} = await runCommand(DataPgAttachmentsIndex, ['DATABASE', '--app=myapp'])

      expect(stderr).to.equal('')
      const output = ansis.strip(removeAllWhitespace(stdout))
      expect(output).to.include(removeAllWhitespace('Attachments for ⛁ advanced-horizontal-01234'))
      expect(output).to.include(removeAllWhitespace('Attachment Credential Pool'))
      expect(output).to.include(removeAllWhitespace('myapp::DATABASE u2vi1nt40t3mcq (owner) leader'))
      expect(output).to.include(removeAllWhitespace('myapp::DATABASE_ANALYST analyst leader'))
      expect(output).to.include(removeAllWhitespace('myapp::DATABASE_ANALYTICS u2vi1nt40t3mcq (owner) analytics'))
    })

    it('displays multiple multi-factor attachments', async function () {
      fakeData.postgresDatabase.listAttachments.resolves({addon, attachments: multipleAttachmentsMultiFactorResponse, credentials})

      const {stderr, stdout} = await runCommand(DataPgAttachmentsIndex, ['DATABASE', '--app=myapp'])

      expect(stderr).to.equal('')
      const output = ansis.strip(removeAllWhitespace(stdout))
      expect(output).to.include(removeAllWhitespace('Attachments for ⛁ advanced-horizontal-01234'))
      expect(output).to.include(removeAllWhitespace('Attachment Credential Pool'))
      expect(output).to.include(removeAllWhitespace('myapp::DATABASE u2vi1nt40t3mcq (owner) leader'))
      expect(output).to.include(removeAllWhitespace('myapp::MULTIFACTOR_ATTACHMENT analyst analytics'))
    })

    it('handles missing namespace gracefully', async function () {
      fakeData.postgresDatabase.listAttachments.resolves({addon, attachments: attachmentWithMissingNamespace, credentials})

      const {stderr, stdout} = await runCommand(DataPgAttachmentsIndex, ['DATABASE', '--app=myapp'])

      expect(stderr).to.equal('')
      const output = ansis.strip(removeAllWhitespace(stdout))
      expect(output).to.include(removeAllWhitespace('Attachments for ⛁ advanced-horizontal-01234'))
      expect(output).to.include(removeAllWhitespace('Attachment Credential Pool'))
      expect(output).to.include(removeAllWhitespace('myapp::DATABASE u2vi1nt40t3mcq (owner) leader'))
    })
  })

  describe('when no attachments exist', function () {
    it('displays appropriate message for empty attachments', async function () {
      fakeData.postgresDatabase.listAttachments.resolves({addon, attachments: emptyAttachmentsResponse, credentials})

      const {stderr, stdout} = await runCommand(DataPgAttachmentsIndex, ['DATABASE', '--app=myapp'])

      expect(stderr).to.equal('')
      expect(ansis.strip(stdout)).to.equal('No attachments found for this database.\n')
    })
  })
})
