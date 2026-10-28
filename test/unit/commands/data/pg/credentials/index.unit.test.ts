import {runCommand} from '@heroku-cli/test-utils'
import {hux} from '@heroku/heroku-cli-util'
import {NotAdvancedDatabaseError} from '@heroku/sdk/resources/data/database-credential'
import ansis from 'ansis'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import DataPgCredentialsIndex from '../../../../../../src/commands/data/pg/credentials/index.js'
import {
  advancedAddon,
  advancedCredentialsAttachmentsMultiFactorResponse,
  advancedCredentialsAttachmentsResponse,
  advancedCredentialsResponse,
  nonAdvancedCredentialsAttachmentsResponse,
  standardAddon,
} from '../../../../../fixtures/data/pg/fixtures.js'
import {type MockSDK, mockSDK} from '../../../../../helpers/mock-sdk.js'
import removeAllWhitespace from '../../../../../helpers/utils/remove-whitespaces.js'

const heredoc = tsheredoc

type FakeData = {
  databaseCredential: {list: SinonStub}
}

type FakePlatform = {
  addOnAttachment: {listByAddOn: SinonStub}
}

function buildFakeData(): FakeData {
  return {databaseCredential: {list: stub()}}
}

function buildFakePlatform(): FakePlatform {
  return {addOnAttachment: {listByAddOn: stub()}}
}

describe('data:pg:credentials:index', function () {
  let fakeData: FakeData
  let fakePlatform: FakePlatform
  let sdkMock: MockSDK

  beforeEach(function () {
    fakeData = buildFakeData()
    fakePlatform = buildFakePlatform()
    sdkMock = mockSDK(fakeData, fakePlatform)
  })

  afterEach(function () {
    sdkMock.restore()
    restore()
  })

  it('shows error for non-advanced databases', async function () {
    fakeData.databaseCredential.list.rejects(new NotAdvancedDatabaseError(standardAddon))
    fakePlatform.addOnAttachment.listByAddOn.resolves(nonAdvancedCredentialsAttachmentsResponse)

    const {error} = await runCommand(DataPgCredentialsIndex, [standardAddon.name, '--app=myapp'])
    const err = error as Error

    expect(ansis.strip(err.message)).to.equal('You can only use this command on Advanced-tier databases.\n'
          + 'Use heroku pg:credentials DATABASE -a myapp instead.')
  })

  it('displays credentials with single-factor attachments in a table', async function () {
    fakeData.databaseCredential.list.resolves({
      addon: advancedAddon,
      credentials: advancedCredentialsResponse,
    })
    fakePlatform.addOnAttachment.listByAddOn.resolves(advancedCredentialsAttachmentsResponse)

    const {stdout} = await runCommand(DataPgCredentialsIndex, [
      'DATABASE',
      '--app=myapp',
    ])

    const actual = removeAllWhitespace(ansis.strip(stdout))
    const expectedHeader = removeAllWhitespace('Credential              Type       State')
    const expectedContent = removeAllWhitespace(heredoc`
      u2vi1nt40t3mcq          owner      active
      └─ as DATABASE

      analyst                 additional active
      └─ as DATABASE_ANALYST
    `)
    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expectedContent)
  })

  it('displays credentials with multi-factor attachments in a table', async function () {
    fakeData.databaseCredential.list.resolves({
      addon: advancedAddon,
      credentials: advancedCredentialsResponse,
    })
    fakePlatform.addOnAttachment.listByAddOn.resolves(advancedCredentialsAttachmentsMultiFactorResponse)

    const {stdout} = await runCommand(DataPgCredentialsIndex, [
      'DATABASE',
      '--app=myapp',
    ])

    const actual = removeAllWhitespace(ansis.strip(stdout))
    const expectedHeader = removeAllWhitespace('Credential              Type       State')
    const expectedContent = removeAllWhitespace(heredoc`
      u2vi1nt40t3mcq                owner      active
      └─ as DATABASE

      analyst                       additional active
      └─ as MULTIFACTOR_ATTACHMENT
    `)
    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expectedContent)
  })

  it('handles API errors gracefully', async function () {
    fakeData.databaseCredential.list.rejects(new Error(`Addon ${advancedAddon.id} not found`))

    const {error} = await runCommand(DataPgCredentialsIndex, [
      'DATABASE',
      '--app=myapp',
    ])
    const err = error as Error
    expect(ansis.strip(err.message)).to.include(`Addon ${advancedAddon.id} not found`)
  })

  it('passes no-wrap option through to table rendering', async function () {
    fakeData.databaseCredential.list.resolves({
      addon: advancedAddon,
      credentials: advancedCredentialsResponse,
    })
    fakePlatform.addOnAttachment.listByAddOn.resolves(advancedCredentialsAttachmentsResponse)

    const tableStub = stub(hux, 'table')
    await runCommand(DataPgCredentialsIndex, ['DATABASE', '--app=myapp', '--no-wrap'])

    const callArgs = tableStub.firstCall.args
    expect(callArgs[2]).to.include({maxWidth: 'none', overflow: 'truncate'})
  })
})
