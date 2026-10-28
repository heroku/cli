import type {RotateDatabaseCredentialPreview} from '@heroku/sdk/resources/data/database-credential'
import type {AddOnAttachment} from '@heroku/types/3.sdk'

import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import {SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import DataPgCredentialsRotate from '../../../../../../src/commands/data/pg/credentials/rotate.js'
import {
  advancedAddon,
  essentialAddon,
  legacyEssentialAddon,
  standardAddon,
} from '../../../../../fixtures/data/pg/fixtures.js'
import {type MockSDK, mockSDKData} from '../../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc

type AdvancedCredential = NonNullable<RotateDatabaseCredentialPreview['ownerCred']>
type ClassicCredential = NonNullable<RotateDatabaseCredentialPreview['defaultCred']>

function attachment(appName: string, namespace: null | string): AddOnAttachment {
  return {
    addon: {
      app: {id: 'billing-app', name: 'myapp'},
      id: 'addon-id',
      name: 'addon-name',
    },
    app: {id: `${appName}-id`, name: appName},
    created_at: '2025-01-01T12:00:00Z',
    id: `${appName}-attachment`,
    log_input_url: null,
    name: appName,
    namespace,
    updated_at: '2025-01-01T12:00:00Z',
    web_url: null,
  }
}

function advancedCredential(name: string, type: AdvancedCredential['type'] = 'additional'): AdvancedCredential {
  return {
    created_at: '2025-01-01T12:00:00Z',
    database: 'd123',
    host: 'ec2.amazonaws.com',
    id: `${name}-id`,
    name,
    port: 5432,
    roles: [{password: 'secret', state: 'active', user: name}],
    state: 'active',
    type,
  }
}

function classicCredential(name: string): ClassicCredential {
  return {
    credentials: [{password: 'secret', state: 'active', user: name}],
    database: 'd123',
    host: 'ec2.amazonaws.com',
    name,
    port: 5432,
    state: 'active',
    uuid: `${name}-uuid`,
  }
}

type FakeData = {
  databaseCredential: {rotate: SinonStub}
}

function buildFakeData(): FakeData {
  return {databaseCredential: {rotate: stub()}}
}

describe('data:pg:credentials:rotate', function () {
  let confirmStub: SinonStub
  let fakeData: FakeData
  let sdkMock: MockSDK

  beforeEach(function () {
    confirmStub = stub(DataPgCredentialsRotate.prototype, 'confirmCommand').resolves()
    fakeData = buildFakeData()
    sdkMock = mockSDKData(fakeData)
  })

  afterEach(function () {
    confirmStub.restore()
    sdkMock.restore()
  })

  context('Advanced-tier databases', function () {
    const owner = advancedCredential('u2vi1nt40t3mcq', 'owner')
    const analyst = advancedCredential('analyst')

    it('rotates a specific credential single-factor attached to a single app successfully', async function () {
      const impact: RotateDatabaseCredentialPreview = {
        addon: advancedAddon,
        attachments: [attachment('myapp', 'role:analyst')],
        credToRotate: analyst,
        isAdvancedTier: true,
        isEssentialTier: false,
        ownerCred: owner,
      }

      fakeData.databaseCredential.rotate.callsFake(async (_addonIdentity, _body, options) => {
        await options?.beforeRotate?.(impact)
        return {addon: advancedAddon, credential: undefined}
      })

      const {stderr, stdout} = await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst',
      ])

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the password for the analyst credential.')
      expect(warningMessage).to.include('This action resets connections older than 30 minutes, and uses a temporary rotation username during the process.')
      expect(warningMessage).to.include('This command will affect the app ⬢ myapp.')
      expect(stderr).to.equal(heredoc`
        Rotating analyst on ⛁ advanced-horizontal-01234... done
      `)
      expect(stdout).to.equal('')
    })

    it('rotates a specific credential attached to multiple apps successfully', async function () {
      const impact: RotateDatabaseCredentialPreview = {
        addon: advancedAddon,
        attachments: [attachment('myapp', 'role:analyst'), attachment('myapp2', 'role:analyst')],
        credToRotate: analyst,
        isAdvancedTier: true,
        isEssentialTier: false,
        ownerCred: owner,
      }

      fakeData.databaseCredential.rotate.callsFake(async (_addonIdentity, _body, options) => {
        await options?.beforeRotate?.(impact)
        return {addon: advancedAddon, credential: undefined}
      })

      const {stderr, stdout} = await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst',
      ])

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the password for the analyst credential.')
      expect(warningMessage).to.include('This action resets connections older than 30 minutes, and uses a temporary rotation username during the process.')
      expect(warningMessage).to.include('This command will affect the apps ⬢ myapp, ⬢ myapp2.')
      expect(stderr).to.equal(heredoc`
        Rotating analyst on ⛁ advanced-horizontal-01234... done
      `)
      expect(stdout).to.equal('')
    })

    it('rotates a specific credential multi-factor attached to a single app successfully', async function () {
      const impact: RotateDatabaseCredentialPreview = {
        addon: advancedAddon,
        attachments: [attachment('myapp', 'role:analyst|proxy:false|pool:analytics')],
        credToRotate: analyst,
        isAdvancedTier: true,
        isEssentialTier: false,
        ownerCred: owner,
      }

      fakeData.databaseCredential.rotate.callsFake(async (_addonIdentity, _body, options) => {
        await options?.beforeRotate?.(impact)
        return {addon: advancedAddon, credential: undefined}
      })

      const {stderr, stdout} = await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst',
      ])

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the password for the analyst credential.')
      expect(warningMessage).to.include('This action resets connections older than 30 minutes, and uses a temporary rotation username during the process.')
      expect(warningMessage).to.include('This command will affect the app ⬢ myapp.')
      expect(stderr).to.equal(heredoc`
        Rotating analyst on ⛁ advanced-horizontal-01234... done
      `)
      expect(stdout).to.equal('')
    })

    it('rotates owner credential by default when no name specified', async function () {
      const impact: RotateDatabaseCredentialPreview = {
        addon: advancedAddon,
        attachments: [attachment('myapp', null)],
        credToRotate: owner,
        isAdvancedTier: true,
        isEssentialTier: false,
        ownerCred: owner,
      }

      fakeData.databaseCredential.rotate.callsFake(async (_addonIdentity, _body, options) => {
        await options?.beforeRotate?.(impact)
        return {addon: advancedAddon, credential: undefined}
      })

      const {stderr, stdout} = await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
      ])

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the password for the u2vi1nt40t3mcq credential.')
      expect(warningMessage).to.include('This action resets connections and applications using the credential.')
      expect(warningMessage).to.include('This command will affect the app ⬢ myapp.')
      expect(stderr).to.equal(heredoc`
        Rotating u2vi1nt40t3mcq on ⛁ advanced-horizontal-01234... done
      `)
      expect(stdout).to.equal('')
    })

    it('rotates all credentials successfully', async function () {
      const impact: RotateDatabaseCredentialPreview = {
        addon: advancedAddon,
        attachments: [],
        isAdvancedTier: true,
        isEssentialTier: false,
        ownerCred: owner,
      }

      fakeData.databaseCredential.rotate.callsFake(async (_addonIdentity, _body, options) => {
        await options?.beforeRotate?.(impact)
        return {addon: advancedAddon, credentials: {message: 'Rotation initiated for all credentials.'}}
      })

      const {stderr, stdout} = await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
        '--all',
      ])

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the passwords for all credentials including the owner (u2vi1nt40t3mcq) credential.')
      expect(warningMessage).to.include('This action resets connections and applications using the credential.')
      expect(stderr).to.equal(heredoc`
        Rotating all credentials on ⛁ advanced-horizontal-01234... done
      `)
      expect(stdout).to.equal('')
    })

    it('rotates specific credential with force flag', async function () {
      const impact: RotateDatabaseCredentialPreview = {
        addon: advancedAddon,
        attachments: [attachment('myapp', 'role:analyst')],
        credToRotate: analyst,
        isAdvancedTier: true,
        isEssentialTier: false,
        ownerCred: owner,
      }

      fakeData.databaseCredential.rotate.callsFake(async (_addonIdentity, _body, options) => {
        await options?.beforeRotate?.(impact)
        return {addon: advancedAddon, credential: undefined}
      })

      const {stderr, stdout} = await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst',
        '--force',
      ])

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the password for the analyst credential.')
      expect(warningMessage).to.include('This action resets connections and applications using the credential.')
      expect(warningMessage).to.include('You can\'t access any followers lagging in replication until they\'re caught up.')
      expect(warningMessage).to.include('This command will affect the app ⬢ myapp.')
      expect(stderr).to.equal(heredoc`
        Rotating analyst on ⛁ advanced-horizontal-01234... done
      `)
      expect(stdout).to.equal('')
      expect(fakeData.databaseCredential.rotate.firstCall.args[1]).to.deep.equal({all: undefined, credName: 'analyst', forced: true})
    })

    it('rotates all credentials with force flag', async function () {
      const impact: RotateDatabaseCredentialPreview = {
        addon: advancedAddon,
        attachments: [],
        isAdvancedTier: true,
        isEssentialTier: false,
        ownerCred: owner,
      }

      fakeData.databaseCredential.rotate.callsFake(async (_addonIdentity, _body, options) => {
        await options?.beforeRotate?.(impact)
        return {addon: advancedAddon, credentials: {message: 'Rotation initiated for all credentials.'}}
      })

      const {stderr, stdout} = await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
        '--all',
        '--force',
      ])

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re force rotating the passwords for all credentials including the owner (u2vi1nt40t3mcq) credential.')
      expect(warningMessage).to.include('This action resets connections and applications using the credential.')
      expect(warningMessage).to.include('You can\'t access any followers lagging in replication until they\'re caught up.')
      expect(stderr).to.equal(heredoc`
        Rotating all credentials on ⛁ advanced-horizontal-01234... done
      `)
      expect(stdout).to.equal('')
      expect(fakeData.databaseCredential.rotate.firstCall.args[1]).to.deep.equal({all: true, credName: undefined, forced: true})
    })
  })

  context('Non-Advanced-tier databases', function () {
    const analyst = classicCredential('analyst')
    const defaultCred = classicCredential('default')

    it('shows error for legacy essential databases when --name does not equal default', async function () {
      fakeData.databaseCredential.rotate.rejects(new Error('Legacy Essential-tier databases do not support named credentials.'))

      const {error} = await runCommand(DataPgCredentialsRotate, [
        legacyEssentialAddon.name,
        '--app=myapp',
        '--name=analyst',
      ])
      expect(error!.message).to.equal('Legacy Essential-tier databases do not support named credentials.')
    })

    it('shows error for essential databases when --name does not equal default', async function () {
      fakeData.databaseCredential.rotate.rejects(new Error('Essential-tier databases do not support named credentials.'))

      const {error} = await runCommand(DataPgCredentialsRotate, [
        essentialAddon.name,
        '--app=myapp',
        '--name=analyst',
      ])
      expect(error!.message).to.equal('Essential-tier databases do not support named credentials.')
    })

    it('rotates a specific credential attached to a single app successfully', async function () {
      const impact: RotateDatabaseCredentialPreview = {
        addon: standardAddon,
        attachments: [attachment('myapp', 'credential:analyst')],
        credToRotate: analyst,
        defaultCred,
        isAdvancedTier: false,
        isEssentialTier: false,
      }

      fakeData.databaseCredential.rotate.callsFake(async (_addonIdentity, _body, options) => {
        await options?.beforeRotate?.(impact)
        return {addon: standardAddon, credential: {message: 'Rotation initiated.'}}
      })

      const {stderr, stdout} = await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst',
      ])

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the password for the analyst credential.')
      expect(warningMessage).to.include('This action resets connections older than 30 minutes, and uses a temporary rotation username during the process.')
      expect(warningMessage).to.include('This command will affect the app ⬢ myapp.')
      expect(stderr).to.equal(heredoc`
        Rotating analyst on ⛁ standard-database... done
      `)
      expect(stdout).to.equal('')
    })

    it('rotates a specific credential attached to multiple apps successfully', async function () {
      const impact: RotateDatabaseCredentialPreview = {
        addon: standardAddon,
        attachments: [attachment('myapp', 'credential:analyst'), attachment('myapp2', 'credential:analyst')],
        credToRotate: analyst,
        defaultCred,
        isAdvancedTier: false,
        isEssentialTier: false,
      }

      fakeData.databaseCredential.rotate.callsFake(async (_addonIdentity, _body, options) => {
        await options?.beforeRotate?.(impact)
        return {addon: standardAddon, credential: {message: 'Rotation initiated.'}}
      })

      const {stderr, stdout} = await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst',
      ])

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the password for the analyst credential.')
      expect(warningMessage).to.include('This action resets connections older than 30 minutes, and uses a temporary rotation username during the process.')
      expect(warningMessage).to.include('This command will affect the apps ⬢ myapp, ⬢ myapp2.')
      expect(stderr).to.equal(heredoc`
        Rotating analyst on ⛁ standard-database... done
      `)
      expect(stdout).to.equal('')
    })

    it('rotates default credential by default when no name specified', async function () {
      const impact: RotateDatabaseCredentialPreview = {
        addon: standardAddon,
        attachments: [attachment('myapp', null)],
        credToRotate: defaultCred,
        defaultCred,
        isAdvancedTier: false,
        isEssentialTier: false,
      }

      fakeData.databaseCredential.rotate.callsFake(async (_addonIdentity, _body, options) => {
        await options?.beforeRotate?.(impact)
        return {addon: standardAddon, credential: {message: 'Rotation initiated.'}}
      })

      const {stderr, stdout} = await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
      ])

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the password for the default credential.')
      expect(warningMessage).to.include('This action resets connections and applications using the credential.')
      expect(warningMessage).to.include('This command will affect the app ⬢ myapp.')
      expect(stderr).to.equal(heredoc`
        Rotating default on ⛁ standard-database... done
      `)
      expect(stdout).to.equal('')
    })

    it('rotates all credentials successfully', async function () {
      const impact: RotateDatabaseCredentialPreview = {
        addon: standardAddon,
        attachments: [],
        defaultCred,
        isAdvancedTier: false,
        isEssentialTier: false,
      }

      fakeData.databaseCredential.rotate.callsFake(async (_addonIdentity, _body, options) => {
        await options?.beforeRotate?.(impact)
        return {addon: standardAddon, credentials: {message: 'Rotation initiated for all credentials.'}}
      })

      const {stderr, stdout} = await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
        '--all',
      ])

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the passwords for all credentials including the default credential.')
      expect(warningMessage).to.include('This action resets connections and applications using the credential.')
      expect(stderr).to.equal(heredoc`
        Rotating all credentials on ⛁ standard-database... done
      `)
      expect(stdout).to.equal('')
    })

    it('rotates specific credential with force flag', async function () {
      const impact: RotateDatabaseCredentialPreview = {
        addon: standardAddon,
        attachments: [attachment('myapp', 'credential:analyst')],
        credToRotate: analyst,
        defaultCred,
        isAdvancedTier: false,
        isEssentialTier: false,
      }

      fakeData.databaseCredential.rotate.callsFake(async (_addonIdentity, _body, options) => {
        await options?.beforeRotate?.(impact)
        return {addon: standardAddon, credential: {message: 'Rotation initiated.'}}
      })

      const {stderr, stdout} = await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst',
        '--force',
      ])

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the password for the analyst credential.')
      expect(warningMessage).to.include('This action resets connections and applications using the credential.')
      expect(warningMessage).to.include('You can\'t access any followers lagging in replication until they\'re caught up.')
      expect(warningMessage).to.include('This command will affect the app ⬢ myapp.')
      expect(stderr).to.equal(heredoc`
        Rotating analyst on ⛁ standard-database... done
      `)
      expect(stdout).to.equal('')
    })

    it('rotates all credentials with force flag', async function () {
      const impact: RotateDatabaseCredentialPreview = {
        addon: standardAddon,
        attachments: [],
        defaultCred,
        isAdvancedTier: false,
        isEssentialTier: false,
      }

      fakeData.databaseCredential.rotate.callsFake(async (_addonIdentity, _body, options) => {
        await options?.beforeRotate?.(impact)
        return {addon: standardAddon, credentials: {message: 'Rotation initiated for all credentials.'}}
      })

      const {stderr, stdout} = await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
        '--all',
        '--force',
      ])

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re force rotating the passwords for all credentials including the default credential.')
      expect(warningMessage).to.include('This action resets connections and applications using the credential.')
      expect(warningMessage).to.include('You can\'t access any followers lagging in replication until they\'re caught up.')
      expect(stderr).to.equal(heredoc`
        Rotating all credentials on ⛁ standard-database... done
      `)
      expect(stdout).to.equal('')
    })

    it('successfully rotates essential-tier database credential', async function () {
      const essentialCred = classicCredential('a1b2c3d4e5f6g7')
      const impact: RotateDatabaseCredentialPreview = {
        addon: essentialAddon,
        attachments: [attachment('myapp', null)],
        credToRotate: essentialCred,
        defaultCred: essentialCred,
        isAdvancedTier: false,
        isEssentialTier: true,
      }

      fakeData.databaseCredential.rotate.callsFake(async (_addonIdentity, _body, options) => {
        await options?.beforeRotate?.(impact)
        return {addon: essentialAddon, credential: {message: 'Rotation initiated.'}}
      })

      const {stderr, stdout} = await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
      ])

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the password for the default credential.')
      expect(warningMessage).to.include('This action resets connections and applications using the credential.')
      expect(warningMessage).to.include('This command will affect the app ⬢ myapp.')
      expect(stderr).to.equal(heredoc`
        Rotating default on ⛁ essential-database... done
      `)
      expect(stdout).to.equal('')
    })
  })

  context('error handling', function () {
    const owner = advancedCredential('u2vi1nt40t3mcq', 'owner')
    const analyst = advancedCredential('analyst')

    it('shows error when no active credentials found', async function () {
      const impact: RotateDatabaseCredentialPreview = {
        addon: advancedAddon,
        attachments: [],
        isAdvancedTier: true,
        isEssentialTier: false,
      }

      fakeData.databaseCredential.rotate.callsFake(async (_addonIdentity, _body, options) => {
        await options?.beforeRotate?.(impact)
      })

      const {error} = await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
      ])
      const err = error as Error
      expect(ansis.strip(err.message)).to.equal('There are no credentials on the database ⛁ advanced-horizontal-01234.')
      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('This action resets connections and applications using the credential.')
    })

    it('handles API errors gracefully with specific credential', async function () {
      const impact: RotateDatabaseCredentialPreview = {
        addon: advancedAddon,
        attachments: [attachment('myapp', 'role:analyst')],
        credToRotate: analyst,
        isAdvancedTier: true,
        isEssentialTier: false,
        ownerCred: owner,
      }

      fakeData.databaseCredential.rotate.callsFake(async (_addonIdentity, _body, options) => {
        await options?.beforeRotate?.(impact)
        throw new Error('Credential not found.')
      })

      const {error} = await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst',
      ])
      const err = error as Error
      expect(ansis.strip(err.message)).to.include('Credential not found.')
      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the password for the analyst credential.')
      expect(warningMessage).to.include('This action resets connections older than 30 minutes, and uses a temporary rotation username during the process.')
      expect(warningMessage).to.include('This command will affect the app ⬢ myapp.')
    })

    it('handles API errors gracefully with all credentials', async function () {
      const impact: RotateDatabaseCredentialPreview = {
        addon: advancedAddon,
        attachments: [],
        isAdvancedTier: true,
        isEssentialTier: false,
        ownerCred: owner,
      }

      fakeData.databaseCredential.rotate.callsFake(async (_addonIdentity, _body, options) => {
        await options?.beforeRotate?.(impact)
        throw new Error('Internal server error.')
      })

      const {error} = await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
        '--all',
      ])
      const err = error as Error
      expect(ansis.strip(err.message)).to.include('Internal server error.')
      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the passwords for all credentials including the owner (u2vi1nt40t3mcq) credential.')
      expect(warningMessage).to.include('This action resets connections and applications using the credential.')
    })
  })
})
