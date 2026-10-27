import type {GetDatabaseCredentialUrlResult} from '@heroku/sdk/resources/data/database-credential'

import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import {SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import DataPgCredentialsUrl from '../../../../../../src/commands/data/pg/credentials/url.js'
import {
  advancedAddon,
  essentialAddon,
  legacyEssentialAddon,
  standardAddon,
} from '../../../../../fixtures/data/pg/fixtures.js'
import {type MockSDK, mockSDKData} from '../../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc

type CredentialConnectionInfo = GetDatabaseCredentialUrlResult['credentialConnectionInfo']

type FakeData = {
  databaseCredential: {getUrl: SinonStub}
}

function buildFakeData(): FakeData {
  return {databaseCredential: {getUrl: stub()}}
}

// cspell:disable
const ownerUrl: CredentialConnectionInfo = {
  credName: 'u2vi1nt40t3mcq',
  database: 'd4w8akz45kmru7',
  host: 'cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com',
  password: 'secret1',
  port: 5432,
  url: 'postgres://u2vi1nt40t3mcq:secret1@cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com:5432/d4w8akz45kmru7',
  user: 'u2vi1nt40t3mcq',
}

const analystUrl: CredentialConnectionInfo = {
  credName: 'analyst',
  database: 'd4w8akz45kmru7',
  host: 'cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com',
  password: 'secret2',
  port: 5432,
  url: 'postgres://analyst:secret2@cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com:5432/d4w8akz45kmru7',
  user: 'analyst',
}
// cspell:enable

describe('data:pg:credentials:url', function () {
  let fakeData: FakeData
  let sdkMock: MockSDK

  beforeEach(function () {
    fakeData = buildFakeData()
    sdkMock = mockSDKData(fakeData)
  })

  afterEach(function () {
    sdkMock.restore()
  })

  it('shows error for Legacy Essential-tier databases with a custom credential name', async function () {
    fakeData.databaseCredential.getUrl.rejects(new Error('Essential-tier databases don\'t support named credentials.'))

    const {error} = await runCommand(DataPgCredentialsUrl, [
      legacyEssentialAddon.name,
      '--app=myapp',
      '--name=non-default-credential',
    ])
    const err = error as Error

    expect(ansis.strip(err.message)).to.equal('Essential-tier databases don\'t support named credentials.')
  })

  it('shows error for Essential-tier databases with a custom credential name', async function () {
    fakeData.databaseCredential.getUrl.rejects(new Error('Essential-tier databases don\'t support named credentials.'))

    const {error} = await runCommand(DataPgCredentialsUrl, [
      essentialAddon.name,
      '--app=myapp',
      '--name=non-default-credential',
    ])
    const err = error as Error

    expect(ansis.strip(err.message)).to.equal('Essential-tier databases don\'t support named credentials.')
  })

  describe('Advanced-tier databases', function () {
    it('shows error when no active credentials found', async function () {
      fakeData.databaseCredential.getUrl.rejects(new Error(`There are no active credentials on the database ${advancedAddon.name}.`))

      const {error} = await runCommand(DataPgCredentialsUrl, [
        'DATABASE',
        '--app=myapp',
      ])
      const err = error as Error

      expect(ansis.strip(err.message)).to.equal('There are no active credentials on the database advanced-horizontal-01234.')
    })

    it('shows error when specified credential isn\'t active', async function () {
      fakeData.databaseCredential.getUrl.rejects(new Error(`The credential analyst isn't active on the database ${advancedAddon.name}.`))

      const {error} = await runCommand(DataPgCredentialsUrl, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst',
      ])
      const err = error as Error

      expect(ansis.strip(err.message)).to.equal('The credential analyst isn\'t active on the database advanced-horizontal-01234.')
    })

    it('shows owner credential URL by default when no name specified', async function () {
      fakeData.databaseCredential.getUrl.resolves({
        addon: advancedAddon,
        credentialConnectionInfo: ownerUrl,
      })

      const {stderr, stdout} = await runCommand(DataPgCredentialsUrl, [
        'DATABASE',
        '--app=myapp',
      ])

      expect(stderr).to.equal('')
      // cspell:disable
      expect(ansis.strip(heredoc(stdout))).to.equal(ansis.strip(heredoc`
          === Connection information for u2vi1nt40t3mcq credential:

          Connection info string:
          "dbname=d4w8akz45kmru7 host=cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com port=5432 user=u2vi1nt40t3mcq password=secret1 sslmode=require"

          Connection URL:
          postgres://u2vi1nt40t3mcq:secret1@cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com:5432/d4w8akz45kmru7

        `))
      // cspell:enable
      expect(fakeData.databaseCredential.getUrl.calledOnceWithExactly('DATABASE', undefined, {appIdentity: 'myapp'})).to.equal(true)
    })

    it('shows specific credential URL when name is specified', async function () {
      fakeData.databaseCredential.getUrl.resolves({
        addon: advancedAddon,
        credentialConnectionInfo: analystUrl,
      })

      const {stderr, stdout} = await runCommand(DataPgCredentialsUrl, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst',
      ])

      expect(stderr).to.equal('')
      // cspell:disable
      expect(ansis.strip(heredoc(stdout))).to.equal(ansis.strip(heredoc`
          === Connection information for analyst credential:

          Connection info string:
          "dbname=d4w8akz45kmru7 host=cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com port=5432 user=analyst password=secret2 sslmode=require"

          Connection URL:
          postgres://analyst:secret2@cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com:5432/d4w8akz45kmru7

        `))
      // cspell:enable
      expect(fakeData.databaseCredential.getUrl.calledOnceWithExactly('DATABASE', 'analyst', {appIdentity: 'myapp'})).to.equal(true)
    })

    it('handles API errors gracefully', async function () {
      fakeData.databaseCredential.getUrl.rejects(new Error('Credential not found.'))

      const {error} = await runCommand(DataPgCredentialsUrl, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst',
      ])
      const err = error as Error
      expect(ansis.strip(err.message)).to.include('Credential not found.')
    })
  })

  describe('Non-Advanced-tier databases', function () {
    it('shows error when specified credential isn\'t active', async function () {
      fakeData.databaseCredential.getUrl.rejects(new Error(`The credential analyst isn't active on the database ${standardAddon.name}.`))

      const {error} = await runCommand(DataPgCredentialsUrl, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst',
      ])
      const err = error as Error

      expect(ansis.strip(err.message)).to.equal('The credential analyst isn\'t active on the database standard-database.')
    })

    it('shows default credential URL by default when no name specified', async function () {
      fakeData.databaseCredential.getUrl.resolves({
        addon: standardAddon,
        credentialConnectionInfo: {...ownerUrl, credName: 'default'},
      })

      const {stderr, stdout} = await runCommand(DataPgCredentialsUrl, [
        'DATABASE',
        '--app=myapp',
      ])

      expect(stderr).to.equal('')
      // cspell:disable
      expect(ansis.strip(heredoc(stdout))).to.equal(ansis.strip(heredoc`
          === Connection information for default credential:

          Connection info string:
          "dbname=d4w8akz45kmru7 host=cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com port=5432 user=u2vi1nt40t3mcq password=secret1 sslmode=require"

          Connection URL:
          postgres://u2vi1nt40t3mcq:secret1@cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com:5432/d4w8akz45kmru7

        `))
      // cspell:enable
    })

    it('shows specific credential URL when name is specified', async function () {
      fakeData.databaseCredential.getUrl.resolves({
        addon: standardAddon,
        credentialConnectionInfo: analystUrl,
      })

      const {stderr, stdout} = await runCommand(DataPgCredentialsUrl, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst',
      ])

      expect(stderr).to.equal('')
      // cspell:disable
      expect(ansis.strip(heredoc(stdout))).to.equal(ansis.strip(heredoc`
          === Connection information for analyst credential:

          Connection info string:
          "dbname=d4w8akz45kmru7 host=cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com port=5432 user=analyst password=secret2 sslmode=require"

          Connection URL:
          postgres://analyst:secret2@cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com:5432/d4w8akz45kmru7

        `))
      // cspell:enable
    })

    it('handles API errors gracefully', async function () {
      fakeData.databaseCredential.getUrl.rejects(new Error('Not found.'))

      const {error} = await runCommand(DataPgCredentialsUrl, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst',
      ])
      const err = error as Error
      expect(ansis.strip(err.message)).to.include('Not found.')
    })
  })
})
