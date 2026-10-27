import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import {SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import DataPgCredentialsCreate from '../../../../../../src/commands/data/pg/credentials/create.js'
import {
  advancedAddon,
  createCredentialResponse,
  essentialAddon,
  legacyEssentialAddon,
  standardAddon,
} from '../../../../../fixtures/data/pg/fixtures.js'
import {type MockSDK, mockSDKData} from '../../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc

type FakeData = {
  databaseCredential: {create: SinonStub}
}

function buildFakeData(): FakeData {
  return {databaseCredential: {create: stub()}}
}

describe('data:pg:credentials:create', function () {
  let fakeData: FakeData
  let sdkMock: MockSDK

  beforeEach(function () {
    fakeData = buildFakeData()
    sdkMock = mockSDKData(fakeData)
  })

  afterEach(function () {
    sdkMock.restore()
  })

  it('shows error for legacy Essential-tier databases', async function () {
    fakeData.databaseCredential.create.rejects(new Error('You can\'t create custom credentials on Essential-tier databases.'))

    const {error} = await runCommand(DataPgCredentialsCreate, [
      legacyEssentialAddon.name,
      '--app=myapp',
      '--name=my-credential',
    ])
    const err = error as Error

    expect(ansis.strip(err.message)).to.equal('You can\'t create custom credentials on Essential-tier databases.')
  })

  it('shows error for Essential-tier databases', async function () {
    fakeData.databaseCredential.create.rejects(new Error('You can\'t create custom credentials on Essential-tier databases.'))

    const {error} = await runCommand(DataPgCredentialsCreate, [
      essentialAddon.name,
      '--app=myapp',
      '--name=my-credential',
    ])
    const err = error as Error

    expect(ansis.strip(err.message)).to.equal('You can\'t create custom credentials on Essential-tier databases.')
  })

  it('creates a credential successfully on Advanced-tier databases', async function () {
    fakeData.databaseCredential.create.resolves({
      addon: advancedAddon,
      credential: createCredentialResponse,
    })

    const {stderr, stdout} = await runCommand(DataPgCredentialsCreate, [
      'DATABASE',
      '--app=myapp',
      '--name=my-credential',
    ])

    expect(stderr).to.equal(heredoc`
      Creating credential my-credential... done
    `)
    expect(ansis.strip(heredoc(stdout))).to.equal(ansis.strip(heredoc`
        Attach the credential to the apps you want to use it in with heroku data:pg:attachments:create advanced-horizontal-01234 --credential my-credential -a myapp.
        Define the new grants for the credential in Postgres with heroku pg:psql advanced-horizontal-01234 -a myapp.

      `))
    expect(fakeData.databaseCredential.create.calledOnceWithExactly('DATABASE', {name: 'my-credential'}, {appIdentity: 'myapp'})).to.equal(true)
  })

  it('creates a credential successfully on legacy non-Essential tier databases', async function () {
    fakeData.databaseCredential.create.resolves({
      addon: standardAddon,
      credential: {message: 'Credential my-credential created.'},
    })

    const {stderr, stdout} = await runCommand(DataPgCredentialsCreate, [
      'DATABASE',
      '--app=myapp',
      '--name=my-credential',
    ])

    expect(stderr).to.equal(heredoc`
      Creating credential my-credential... done
    `)
    expect(ansis.strip(heredoc(stdout))).to.equal(ansis.strip(heredoc`
        Attach the credential to the apps you want to use it in with heroku addons:attach standard-database --credential my-credential -a myapp.
        Define the new grants for the credential in Postgres with heroku pg:psql standard-database -a myapp.

      `))
  })

  it('handles API errors gracefully on Advanced-tier databases', async function () {
    fakeData.databaseCredential.create.rejects(new Error(heredoc`
      my-credential on ${advancedAddon.name} already exists.
      Credential names must be unique within the database. Choose another name and try again.
    `))

    const {error, stderr} = await runCommand(DataPgCredentialsCreate, [
      'DATABASE',
      '--app=myapp',
      '--name=my-credential',
    ])
    const err = error as Error
    expect(ansis.strip(err.message)).to.include(heredoc`
          my-credential on ${advancedAddon.name} already exists.
          Credential names must be unique within the database. Choose another name and try again.
        `)
    expect(ansis.strip(stderr)).to.equal(heredoc`
      Creating credential my-credential... !
    `)
  })

  it('handles API errors gracefully on legacy non-Essential tier databases', async function () {
    fakeData.databaseCredential.create.rejects(new Error(heredoc`
      my-credential on ${standardAddon.name} already exists.
      Credential names must be unique within the database. Choose another name and try again.
    `))

    const {error, stderr} = await runCommand(DataPgCredentialsCreate, [
      'DATABASE',
      '--app=myapp',
      '--name=my-credential',
    ])
    const err = error as Error
    expect(ansis.strip(err.message)).to.include(heredoc`
          my-credential on ${standardAddon.name} already exists.
          Credential names must be unique within the database. Choose another name and try again.
        `)
    expect(ansis.strip(stderr)).to.equal(heredoc`
      Creating credential my-credential... !
    `)
  })
})
