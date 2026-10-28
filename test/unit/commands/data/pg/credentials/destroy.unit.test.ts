import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import {SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import DataPgCredentialsDestroy from '../../../../../../src/commands/data/pg/credentials/destroy.js'
import {
  advancedAddon,
  essentialAddon,
  legacyEssentialAddon,
  standardAddon,
} from '../../../../../fixtures/data/pg/fixtures.js'
import {type MockSDK, mockSDKData} from '../../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc

type FakeData = {
  databaseCredential: {destroy: SinonStub}
}

function buildFakeData(): FakeData {
  return {databaseCredential: {destroy: stub()}}
}

describe('data:pg:credentials:destroy', function () {
  let fakeData: FakeData
  let sdkMock: MockSDK

  beforeEach(function () {
    fakeData = buildFakeData()
    sdkMock = mockSDKData(fakeData)
  })

  afterEach(function () {
    sdkMock.restore()
  })

  it('shows error for Legacy Essential-tier databases', async function () {
    fakeData.databaseCredential.destroy.rejects(new Error('You can\'t destroy the default credential.'))

    const {error} = await runCommand(DataPgCredentialsDestroy, [
      legacyEssentialAddon.name,
      '--app=myapp',
      '--name=default',
      '--confirm=myapp',
    ])
    const err = error as Error

    expect(ansis.strip(err.message)).to.equal('You can\'t destroy the default credential.')
  })

  it('shows error for Essential-tier databases', async function () {
    fakeData.databaseCredential.destroy.rejects(new Error('You can\'t destroy custom credentials on Essential-tier databases.'))

    const {error} = await runCommand(DataPgCredentialsDestroy, [
      essentialAddon.name,
      '--app=myapp',
      '--name=default',
      '--confirm=myapp',
    ])
    const err = error as Error

    expect(ansis.strip(err.message)).to.equal('You can\'t destroy custom credentials on Essential-tier databases.')
  })

  it('shows error for non-Advanced-tier databases when trying to destroy default credential', async function () {
    fakeData.databaseCredential.destroy.rejects(new Error('You can\'t destroy the default credential.'))

    const {error} = await runCommand(DataPgCredentialsDestroy, [
      standardAddon.name,
      '--app=myapp',
      '--name=default',
      '--confirm=myapp',
    ])
    const err = error as Error

    expect(ansis.strip(err.message)).to.equal('You can\'t destroy the default credential.')
  })

  it('shows error for Advanced-tier databases when trying to destroy owner credential', async function () {
    fakeData.databaseCredential.destroy.rejects(new Error('You can\'t destroy the owner credential.'))

    const {error} = await runCommand(DataPgCredentialsDestroy, [
      'DATABASE',
      '--app=myapp',
      '--name=u2vi1nt40t3mcq', // owner credential name
      '--confirm=myapp',
    ])
    const err = error as Error

    expect(ansis.strip(err.message)).to.equal("You can't destroy the owner credential.")
  })

  describe('Advanced-tier databases', function () {
    it('shows an error when credential is single-factor attached to a single app', async function () {
      fakeData.databaseCredential.destroy.rejects(new Error('You must detach the credential analyst from the app myapp before destroying it.'))

      const {error} = await runCommand(DataPgCredentialsDestroy, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst', // credential that has attachments
        '--confirm=myapp',
      ])
      const err = error as Error

      expect(ansis.strip(err.message)).to.equal('You must detach the credential analyst from the app myapp before destroying it.')
    })

    it('shows an error when credential is multi-factor attached to a single app', async function () {
      fakeData.databaseCredential.destroy.rejects(new Error('You must detach the credential analyst from the app myapp before destroying it.'))

      const {error} = await runCommand(DataPgCredentialsDestroy, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst', // credential that has attachments
        '--confirm=myapp',
      ])

      const err = error as Error
      expect(ansis.strip(err.message)).to.equal('You must detach the credential analyst from the app myapp before destroying it.')
    })

    it('shows an error when credential is single-factor attached to multiple apps', async function () {
      fakeData.databaseCredential.destroy.rejects(new Error('You must detach the credential analyst from the apps myapp, myapp2 before destroying it.'))

      const {error} = await runCommand(DataPgCredentialsDestroy, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst', // credential that has attachments
        '--confirm=myapp',
      ])
      const err = error as Error

      expect(ansis.strip(err.message)).to.equal('You must detach the credential analyst from the apps myapp, myapp2 before destroying it.')
    })

    it('shows an error when credential is multi-factor attached to multiple apps', async function () {
      fakeData.databaseCredential.destroy.rejects(new Error('You must detach the credential analyst from the apps myapp, myapp2 before destroying it.'))

      const {error} = await runCommand(DataPgCredentialsDestroy, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst', // credential that has attachments
        '--confirm=myapp',
      ])

      const err = error as Error
      expect(ansis.strip(err.message)).to.equal('You must detach the credential analyst from the apps myapp, myapp2 before destroying it.')
    })

    it('destroys a credential successfully', async function () {
      fakeData.databaseCredential.destroy.resolves({
        addon: advancedAddon,
        result: undefined,
      })

      const {stderr, stdout} = await runCommand(DataPgCredentialsDestroy, [
        'DATABASE',
        '--app=myapp',
        '--name=my-credential',
        '--confirm=myapp',
      ])

      expect(stderr).to.equal(heredoc`
        Destroying credential my-credential... done
      `)
      expect(ansis.strip(heredoc(stdout))).to.equal(ansis.strip(heredoc`
          We destroyed the credential my-credential in ⛁ advanced-horizontal-01234.
          Database objects owned by my-credential will be assigned to the owner credential.
        `))
      expect(fakeData.databaseCredential.destroy.calledOnce).to.equal(true)
      expect(fakeData.databaseCredential.destroy.firstCall.args[0]).to.equal('DATABASE')
      expect(fakeData.databaseCredential.destroy.firstCall.args[1]).to.equal('my-credential')
      expect(fakeData.databaseCredential.destroy.firstCall.args[2].appIdentity).to.equal('myapp')
    })

    it('handles API errors gracefully', async function () {
      fakeData.databaseCredential.destroy.rejects(new Error('Not found.'))

      const {error, stderr} = await runCommand(DataPgCredentialsDestroy, [
        'DATABASE',
        '--app=myapp',
        '--name=my-credential',
        '--confirm=myapp',
      ])
      const err = error as Error
      expect(ansis.strip(err.message)).to.include('Not found.')
      expect(ansis.strip(stderr)).to.equal(heredoc`
        Destroying credential my-credential... !
      `)
    })
  })

  describe('Non-Advanced-tier databases', function () {
    it('shows an error when credential is attached to a single app', async function () {
      fakeData.databaseCredential.destroy.rejects(new Error('You must detach the credential analyst from the app myapp before destroying it.'))

      const {error} = await runCommand(DataPgCredentialsDestroy, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst', // credential that has attachments
        '--confirm=myapp',
      ])
      const err = error as Error

      expect(ansis.strip(err.message)).to.equal('You must detach the credential analyst from the app myapp before destroying it.')
    })

    it('shows an error when credential is attached to multiple apps', async function () {
      fakeData.databaseCredential.destroy.rejects(new Error('You must detach the credential analyst from the apps myapp, myapp2 before destroying it.'))

      const {error} = await runCommand(DataPgCredentialsDestroy, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst', // credential that has attachments
        '--confirm=myapp',
      ])
      const err = error as Error

      expect(ansis.strip(err.message)).to.equal('You must detach the credential analyst from the apps myapp, myapp2 before destroying it.')
    })

    it('destroys a credential successfully', async function () {
      fakeData.databaseCredential.destroy.resolves({
        addon: standardAddon,
        result: undefined,
      })

      const {stderr, stdout} = await runCommand(DataPgCredentialsDestroy, [
        'DATABASE',
        '--app=myapp',
        '--name=my-credential',
        '--confirm=myapp',
      ])

      expect(stderr).to.equal(heredoc`
        Destroying credential my-credential... done
      `)
      expect(ansis.strip(heredoc(stdout))).to.equal(ansis.strip(heredoc`
          We destroyed the credential my-credential in ⛁ standard-database.
          Database objects owned by my-credential will be assigned to the default credential.
        `))
    })

    it('handles API errors gracefully', async function () {
      fakeData.databaseCredential.destroy.rejects(new Error('Not found.'))

      const {error, stderr} = await runCommand(DataPgCredentialsDestroy, [
        'DATABASE',
        '--app=myapp',
        '--name=my-credential',
        '--confirm=myapp',
      ])
      const err = error as Error
      expect(ansis.strip(err.message)).to.include('Not found.')
      expect(ansis.strip(stderr)).to.equal(heredoc`
        Destroying credential my-credential... !
      `)
    })
  })
})
