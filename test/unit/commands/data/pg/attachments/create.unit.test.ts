import {runCommand} from '@heroku-cli/test-utils'
import {NotFoundError} from '@heroku/heroku-fetch'
import {type CreateAttachmentBody, NotAdvancedDatabaseError} from '@heroku/sdk/resources/data/postgres-database'
import ansis from 'ansis'
import {expect} from 'chai'
import {
  match, restore, SinonStub, stub,
} from 'sinon'

import DataPgAttachmentsCreate from '../../../../../../src/commands/data/pg/attachments/create.js'
import {
  advancedAddon,
  advancedCredentialsResponse,
  createAttachmentResponse,
  createCredentialAttachmentResponse,
  createForeignAttachmentResponse,
  pgInfo,
  releasesResponse,
  standardAddon,
} from '../../../../../fixtures/data/pg/fixtures.js'
import {type MockSDK, mockSDKData} from '../../../../../helpers/mock-sdk.js'

const releaseVersion = releasesResponse[0].version
const advancedAddonIdentity = `${advancedAddon.app.name}::${advancedAddon.name}`

type FakeData = {
  databaseCredential: {list: SinonStub}
  postgres: {info: SinonStub}
  postgresDatabase: {createAttachment: SinonStub}
}

function buildFakeData(): FakeData {
  return {
    databaseCredential: {list: stub()},
    postgres: {info: stub()},
    postgresDatabase: {createAttachment: stub()},
  }
}

function createAttachmentBody(role: string, pool: string, name?: string): CreateAttachmentBody {
  return {
    confirm: undefined,
    name,
    namespace_config: {
      pool,
      proxy: 'false',
      role,
    },
  }
}

describe('data:pg:attachments:create', function () {
  let fakeData: FakeData
  let sdkMock: MockSDK
  let promptStub: SinonStub

  beforeEach(function () {
    fakeData = buildFakeData()
    sdkMock = mockSDKData(fakeData)
    promptStub = stub(DataPgAttachmentsCreate.prototype, 'prompt')
  })

  afterEach(function () {
    sdkMock.restore()
    restore()
  })

  it('shows error for non-advanced databases', async function () {
    fakeData.databaseCredential.list.rejects(new NotAdvancedDatabaseError(standardAddon, 'not an advanced-tier database'))

    const {error} = await runCommand(DataPgAttachmentsCreate, [
      'advanced-horizontal-01234',
      '--app=myapp',
      '--as=TEST',
    ])
    const err = error as Error

    expect(ansis.strip(err.message)).to.equal('You can only use this command on Advanced-tier databases.\n'
         + 'Use heroku addons:attach standard-database -a myapp --as TEST instead.')
    expect(fakeData.databaseCredential.list.calledOnceWithExactly('advanced-horizontal-01234', {appIdentity: 'myapp'})).to.equal(true)
    expect(fakeData.postgresDatabase.createAttachment.called).to.equal(false)
  })

  describe('basic attachment creation', function () {
    it('creates a multi-factor attachment to the same app', async function () {
      fakeData.databaseCredential.list.resolves({
        addon: advancedAddon,
        credentials: advancedCredentialsResponse,
      })
      fakeData.postgres.info.resolves(pgInfo)
      fakeData.postgresDatabase.createAttachment.callsFake(async (_app, _database, _body, options) => {
        await options?.onAttached?.(createAttachmentResponse)
        return {addon: advancedAddon, attachment: createAttachmentResponse, releaseVersion}
      })

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

      expect(fakeData.databaseCredential.list.calledOnceWithExactly('advanced-horizontal-01234', {appIdentity: 'myapp'})).to.equal(true)
      expect(fakeData.postgres.info.calledOnceWithExactly(advancedAddon.id)).to.equal(true)
      expect(fakeData.postgresDatabase.createAttachment.calledOnceWithExactly(
        'myapp',
        advancedAddonIdentity,
        createAttachmentBody('u2vi1nt40t3mcq', 'leader', 'TEST'),
        {onAttached: match.func},
      )).to.equal(true)
      expect(ansis.strip(stderr)).to.include('Attaching advanced-horizontal-01234 with credential u2vi1nt40t3mcq and pool leader as TEST to ⬢ myapp... done')
      expect(ansis.strip(stderr)).to.include('Setting TEST config vars and restarting ⬢ myapp... done, v123')
    })

    it('creates a foreign multi-factor attachment to a different app using the database name', async function () {
      fakeData.databaseCredential.list.onFirstCall().rejects(new NotFoundError(new Response(null, {status: 404}), {
        id: 'not_found',
        message: 'Couldn\'t find that addon.',
        resource: 'add_on',
      }))
      fakeData.databaseCredential.list.onSecondCall().resolves({addon: advancedAddon, credentials: advancedCredentialsResponse})
      fakeData.postgres.info.resolves(pgInfo)
      fakeData.postgresDatabase.createAttachment.callsFake(async (_app, _database, _body, options) => {
        await options?.onAttached?.(createForeignAttachmentResponse)
        return {addon: advancedAddon, attachment: createForeignAttachmentResponse, releaseVersion}
      })
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

      expect(fakeData.databaseCredential.list.firstCall.args).to.deep.equal(['advanced-horizontal-01234', {appIdentity: 'myapp2'}])
      expect(fakeData.databaseCredential.list.secondCall.args).to.deep.equal(['advanced-horizontal-01234'])
      expect(fakeData.postgresDatabase.createAttachment.calledOnceWithExactly(
        'myapp2',
        advancedAddonIdentity,
        createAttachmentBody('u2vi1nt40t3mcq', 'leader', 'TEST2'),
        {onAttached: match.func},
      )).to.equal(true)
      expect(ansis.strip(stderr)).to.include('Attaching advanced-horizontal-01234 with credential u2vi1nt40t3mcq and pool leader as TEST2 to ⬢ myapp2... done')
      expect(ansis.strip(stderr)).to.include('Setting TEST2 config vars and restarting ⬢ myapp2... done, v123')
    })

    it('creates a foreign multi-factor attachment to a different app using an app namespaced attachment name', async function () {
      fakeData.databaseCredential.list.resolves({
        addon: advancedAddon,
        credentials: advancedCredentialsResponse,
      })
      fakeData.postgres.info.resolves(pgInfo)
      fakeData.postgresDatabase.createAttachment.callsFake(async (_app, _database, _body, options) => {
        await options?.onAttached?.(createForeignAttachmentResponse)
        return {addon: advancedAddon, attachment: createForeignAttachmentResponse, releaseVersion}
      })
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

      expect(fakeData.databaseCredential.list.calledOnceWithExactly('myapp::DATABASE', {appIdentity: 'myapp2'})).to.equal(true)
      expect(fakeData.postgresDatabase.createAttachment.calledOnceWithExactly(
        'myapp2',
        advancedAddonIdentity,
        createAttachmentBody('u2vi1nt40t3mcq', 'leader', 'TEST2'),
        {onAttached: match.func},
      )).to.equal(true)
      expect(ansis.strip(stderr)).to.include('Attaching advanced-horizontal-01234 with credential u2vi1nt40t3mcq and pool leader as TEST2 to ⬢ myapp2... done')
      expect(ansis.strip(stderr)).to.include('Setting TEST2 config vars and restarting ⬢ myapp2... done, v123')
    })

    it('creates a multi-factor attachment without a custom attachment name', async function () {
      const attachment = {
        ...createAttachmentResponse,
        name: 'HEROKU_POSTGRESQL_COBALT',
      }
      fakeData.databaseCredential.list.resolves({
        addon: advancedAddon,
        credentials: advancedCredentialsResponse,
      })
      fakeData.postgres.info.resolves(pgInfo)
      fakeData.postgresDatabase.createAttachment.callsFake(async (_app, _database, _body, options) => {
        await options?.onAttached?.(attachment)
        return {addon: advancedAddon, attachment, releaseVersion}
      })
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

      expect(fakeData.postgresDatabase.createAttachment.calledOnceWithExactly(
        'myapp',
        advancedAddonIdentity,
        createAttachmentBody('u2vi1nt40t3mcq', 'leader'),
        {onAttached: match.func},
      )).to.equal(true)
      expect(ansis.strip(stderr)).to.include('Attaching advanced-horizontal-01234 with credential u2vi1nt40t3mcq and pool leader to ⬢ myapp... done')
      expect(ansis.strip(stderr)).to.include('Setting HEROKU_POSTGRESQL_COBALT config vars and restarting ⬢ myapp... done, v123')
    })

    it('creates a multi-factor attachment with a custom attachment name', async function () {
      const attachment = {
        ...createAttachmentResponse,
        name: 'MY_CUSTOM_NAME',
      }
      fakeData.databaseCredential.list.resolves({
        addon: advancedAddon,
        credentials: advancedCredentialsResponse,
      })
      fakeData.postgres.info.resolves(pgInfo)
      fakeData.postgresDatabase.createAttachment.callsFake(async (_app, _database, _body, options) => {
        await options?.onAttached?.(attachment)
        return {addon: advancedAddon, attachment, releaseVersion}
      })
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

      expect(fakeData.postgresDatabase.createAttachment.calledOnceWithExactly(
        'myapp',
        advancedAddonIdentity,
        createAttachmentBody('u2vi1nt40t3mcq', 'leader', 'MY_CUSTOM_NAME'),
        {onAttached: match.func},
      )).to.equal(true)
      expect(ansis.strip(stderr)).to.include('Attaching advanced-horizontal-01234 with credential u2vi1nt40t3mcq and pool leader as MY_CUSTOM_NAME to ⬢ myapp... done')
      expect(ansis.strip(stderr)).to.include('Setting MY_CUSTOM_NAME config vars and restarting ⬢ myapp... done, v123')
    })

    it('handles API errors gracefully on the add-on resolution', async function () {
      fakeData.databaseCredential.list.rejects(new Error('Internal server error.'))

      const {error} = await runCommand(DataPgAttachmentsCreate, [
        'advanced-horizontal-01234',
        '--app=myapp',
      ])
      const err = error as Error
      expect(fakeData.databaseCredential.list.calledOnceWithExactly('advanced-horizontal-01234', {appIdentity: 'myapp'})).to.equal(true)
      expect(fakeData.postgresDatabase.createAttachment.called).to.equal(false)
      expect(ansis.strip(err.message)).to.equal('Internal server error.')
    })

    it('handles API errors gracefully if the add-on doesn\'t exist', async function () {
      fakeData.databaseCredential.list.rejects(new NotFoundError(new Response(null, {status: 404}), {
        id: 'not_found',
        message: 'Couldn\'t find that addon.',
        resource: 'add_on',
      }))

      const {error} = await runCommand(DataPgAttachmentsCreate, [
        'advanced-horizontal-01234',
        '--app=myapp',
      ])
      const err = error as Error
      expect(fakeData.databaseCredential.list.callCount).to.equal(2)
      expect(fakeData.databaseCredential.list.firstCall.args).to.deep.equal(['advanced-horizontal-01234', {appIdentity: 'myapp'}])
      expect(fakeData.databaseCredential.list.secondCall.args).to.deep.equal(['advanced-horizontal-01234'])
      expect(ansis.strip(err.message)).to.equal('Couldn\'t find that addon.')
    })

    it('handles API errors gracefully on the attachment creation', async function () {
      fakeData.databaseCredential.list.resolves({
        addon: advancedAddon,
        credentials: advancedCredentialsResponse,
      })
      fakeData.postgresDatabase.createAttachment.rejects(new Error('Internal server error.'))

      const {error, stderr} = await runCommand(DataPgAttachmentsCreate, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--as=TEST',
        '--credential=u2vi1nt40t3mcq',
        '--pool=leader',
      ])
      expect(fakeData.databaseCredential.list.calledOnce).to.equal(true)
      expect(fakeData.postgresDatabase.createAttachment.calledOnceWithExactly(
        'myapp',
        advancedAddonIdentity,
        createAttachmentBody('u2vi1nt40t3mcq', 'leader', 'TEST'),
        {onAttached: match.func},
      )).to.equal(true)
      expect(ansis.strip(error?.message ?? '')).to.equal('Internal server error.')
      expect(fakeData.postgres.info.called).to.equal(false)
      expect(ansis.strip(stderr)).to.include('Attaching advanced-horizontal-01234 with credential u2vi1nt40t3mcq and pool leader as TEST to ⬢ myapp... !')
    })

    it('handles API errors gracefully on the release retrieval', async function () {
      fakeData.databaseCredential.list.resolves({
        addon: advancedAddon,
        credentials: advancedCredentialsResponse,
      })
      fakeData.postgresDatabase.createAttachment.callsFake(async (_app, _database, _body, options) => {
        await options?.onAttached?.(createAttachmentResponse)
        throw new Error('Internal server error.')
      })

      const {error, stderr} = await runCommand(DataPgAttachmentsCreate, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--as=TEST',
        '--credential=u2vi1nt40t3mcq',
        '--pool=leader',
      ])
      expect(fakeData.databaseCredential.list.calledOnce).to.equal(true)
      expect(ansis.strip(error?.message ?? '')).to.equal('Internal server error.')
      expect(ansis.strip(stderr)).to.include('Attaching advanced-horizontal-01234 with credential u2vi1nt40t3mcq and pool leader as TEST to ⬢ myapp... done')
      expect(ansis.strip(stderr)).to.include('Setting TEST config vars and restarting ⬢ myapp... !')
    })
  })

  describe('non-interactive attachment creation', function () {
    it('creates a multi-factor attachment with the specified credential, pool and attachment name', async function () {
      const attachment = {
        ...createCredentialAttachmentResponse,
        name: 'MYCREDENTIAL',
        namespace: 'role:mycredential|proxy:false|pool:mypool',
      }
      fakeData.databaseCredential.list.resolves({
        addon: advancedAddon,
        credentials: advancedCredentialsResponse,
      })
      fakeData.postgresDatabase.createAttachment.callsFake(async (_app, _database, _body, options) => {
        await options?.onAttached?.(attachment)
        return {addon: advancedAddon, attachment, releaseVersion}
      })

      const {stderr} = await runCommand(DataPgAttachmentsCreate, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--as=MYCREDENTIAL',
        '--credential=mycredential',
        '--pool=mypool',
      ])

      expect(promptStub.called).to.equal(false)
      expect(fakeData.postgres.info.called).to.equal(false)
      expect(fakeData.postgresDatabase.createAttachment.calledOnceWithExactly(
        'myapp',
        advancedAddonIdentity,
        createAttachmentBody('mycredential', 'mypool', 'MYCREDENTIAL'),
        {onAttached: match.func},
      )).to.equal(true)
      expect(ansis.strip(stderr)).to.include('Attaching advanced-horizontal-01234 with credential mycredential and pool mypool as MYCREDENTIAL to ⬢ myapp... done')
      expect(ansis.strip(stderr)).to.include('Setting MYCREDENTIAL config vars and restarting ⬢ myapp... done, v123')
    })
  })

  describe('error handling for missing credential or pool', function () {
    it('throws a specific error when credential doesn\'t exist', async function () {
      fakeData.databaseCredential.list.resolves({
        addon: advancedAddon,
        credentials: advancedCredentialsResponse,
      })
      fakeData.postgresDatabase.createAttachment.rejects(new Error('invalid credential provided'))

      const {error} = await runCommand(DataPgAttachmentsCreate, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--as=MYCREDENTIAL',
        '--credential=mycredential',
        '--pool=mypool',
      ])
      expect(fakeData.databaseCredential.list.calledOnce).to.equal(true)
      expect(ansis.strip(error?.message ?? '')).to.equal('The credential mycredential doesn\'t exist on the database ⛁ advanced-horizontal-01234.\n'
        + 'Use heroku data:pg:credentials advanced-horizontal-01234 -a myapp '
        + 'to list the credentials on the database.')
    })

    it('throws a specific error when pool doesn\'t exist', async function () {
      fakeData.databaseCredential.list.resolves({
        addon: advancedAddon,
        credentials: advancedCredentialsResponse,
      })
      fakeData.postgresDatabase.createAttachment.rejects(new Error('invalid pool provided'))

      const {error} = await runCommand(DataPgAttachmentsCreate, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--as=MYCREDENTIAL',
        '--credential=mycredential',
        '--pool=mypool',
      ])
      expect(fakeData.databaseCredential.list.calledOnce).to.equal(true)
      expect(ansis.strip(error?.message ?? '')).to.equal('The pool mypool doesn\'t exist on the database ⛁ advanced-horizontal-01234.\n'
        + 'Use heroku data:pg:info advanced-horizontal-01234 -a myapp '
        + 'to list the pools on the database.')
    })
  })
})
