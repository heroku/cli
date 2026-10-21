import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {getPostgresServiceName} from '@heroku/sdk/resources/data/postgres-database'
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
  postgresCredential: {list: SinonStub}
}

type FakePlatform = {
  addOn: {resolve: SinonStub}
  addOnAttachment: {listByAddOn: SinonStub}
}

function buildFakeData(): FakeData {
  return {postgresCredential: {list: stub()}}
}

function buildFakePlatform(): FakePlatform {
  return {
    addOn: {resolve: stub()},
    addOnAttachment: {listByAddOn: stub()},
  }
}

describe('data:pg:attachments', function () {
  let fakeData: FakeData
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakeData = buildFakeData()
    fakePlatform = buildFakePlatform()
    stub(HerokuSDK.prototype, 'data').get(() => fakeData)
    stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    restore()
  })

  it('shows error for non-advanced databases', async function () {
    fakePlatform.addOn.resolve.resolves(nonAdvancedAddon)

    const {error} = await runCommand(DataPgAttachmentsIndex, [
      'DATABASE',
      '--app=myapp',
    ])
    const err = error as Error

    expect(ansis.strip(err.message)).to.equal('You can only use this command on Advanced-tier databases.\n'
         + 'Use heroku addons:info standard-database -a myapp instead.')
    expect(fakePlatform.addOn.resolve.calledOnceWithExactly('DATABASE', {
      addonService: getPostgresServiceName(),
      appIdentity: 'myapp',
    })).to.equal(true)
    expect(fakePlatform.addOnAttachment.listByAddOn.called).to.equal(false)
  })

  describe('when attachments exist', function () {
    it('displays single attachment information', async function () {
      fakePlatform.addOn.resolve.resolves(addon)
      fakePlatform.addOnAttachment.listByAddOn.resolves(singleAttachmentResponse)
      fakeData.postgresCredential.list.resolves(advancedCredentialsResponse)

      const {stderr, stdout} = await runCommand(DataPgAttachmentsIndex, ['DATABASE', '--app=myapp'])

      expect(stderr).to.equal('')
      const output = ansis.strip(removeAllWhitespace(stdout))
      expect(output).to.include(removeAllWhitespace('Attachments for ⛁ advanced-horizontal-01234'))
      expect(output).to.include(removeAllWhitespace('Attachment Credential Pool'))
      expect(output).to.include(removeAllWhitespace('myapp::DATABASE u2vi1nt40t3mcq (owner) leader'))
      expect(fakeData.postgresCredential.list.calledOnceWithExactly(addon.id)).to.equal(true)
      expect(fakePlatform.addOnAttachment.listByAddOn.calledOnceWithExactly(addon.id)).to.equal(true)
    })

    it('displays multiple attachments', async function () {
      fakePlatform.addOn.resolve.resolves(addon)
      fakePlatform.addOnAttachment.listByAddOn.resolves(multipleAttachmentsResponse)
      fakeData.postgresCredential.list.resolves(advancedCredentialsResponse)

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
      fakePlatform.addOn.resolve.resolves(addon)
      fakePlatform.addOnAttachment.listByAddOn.resolves(multipleAttachmentsMultiFactorResponse)
      fakeData.postgresCredential.list.resolves(advancedCredentialsResponse)

      const {stderr, stdout} = await runCommand(DataPgAttachmentsIndex, ['DATABASE', '--app=myapp'])

      expect(stderr).to.equal('')
      const output = ansis.strip(removeAllWhitespace(stdout))
      expect(output).to.include(removeAllWhitespace('Attachments for ⛁ advanced-horizontal-01234'))
      expect(output).to.include(removeAllWhitespace('Attachment Credential Pool'))
      expect(output).to.include(removeAllWhitespace('myapp::DATABASE u2vi1nt40t3mcq (owner) leader'))
      expect(output).to.include(removeAllWhitespace('myapp::MULTIFACTOR_ATTACHMENT analyst analytics'))
    })

    it('handles missing namespace gracefully', async function () {
      fakePlatform.addOn.resolve.resolves(addon)
      fakePlatform.addOnAttachment.listByAddOn.resolves(attachmentWithMissingNamespace)
      fakeData.postgresCredential.list.resolves(advancedCredentialsResponse)

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
      fakePlatform.addOn.resolve.resolves(addon)
      fakePlatform.addOnAttachment.listByAddOn.resolves(emptyAttachmentsResponse)
      fakeData.postgresCredential.list.resolves(advancedCredentialsResponse)

      const {stderr, stdout} = await runCommand(DataPgAttachmentsIndex, ['DATABASE', '--app=myapp'])

      expect(stderr).to.equal('')
      expect(ansis.strip(stdout)).to.equal('No attachments found for this database.\n')
    })
  })
})
