import type {AddOnAttachment} from '@heroku/types/3.sdk'

import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {
  DatabaseAlreadyPromotedError,
  DatabaseNotReadyError,
  DatabasePromotionError,
  DatabaseReleasePhaseError,
  type PromoteDatabaseOptions,
  type PromoteDatabasePreview,
  type PromoteDatabaseResult,
} from '@heroku/sdk/extensions/data'
import {ux} from '@oclif/core'
import ansis from 'ansis'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/pg/promote.js'

const heredoc = tsheredoc
const addon = {
  app: {id: 'app-1', name: 'myapp'},
  id: 'db-1',
  name: 'dwh-db',
  plan: {id: 'plan-1', name: 'heroku-postgresql:standard-2'},
}
const otherAddon = {
  app: {id: 'app-1', name: 'myapp'},
  id: 'db-2',
  name: 'postgres-2',
  plan: {id: 'plan-1', name: 'heroku-postgresql:standard-2'},
}
const makeAttachment = (fields: Pick<AddOnAttachment, 'addon' | 'id' | 'name' | 'namespace'>): AddOnAttachment => ({
  addon: fields.addon,
  app: addon.app,
  created_at: '2026-01-01T00:00:00Z',
  id: fields.id,
  log_input_url: null,
  name: fields.name,
  namespace: fields.namespace,
  updated_at: '2026-01-01T00:00:00Z',
  web_url: 'https://addons-sso.heroku.com/',
})
const attachment = makeAttachment({
  addon, id: 'attachment-1', name: 'DATABASE', namespace: null,
})
const alias = makeAttachment({
  addon: otherAddon, id: 'alias-1', name: 'RED', namespace: null,
})
const backup = makeAttachment({
  addon: otherAddon, id: 'backup-1', name: 'GREEN', namespace: null,
})
const pooler = makeAttachment({
  addon: otherAddon, id: 'pooler-1', name: 'DATABASE_CONNECTION_POOL', namespace: 'connection-pooling:default',
})

const preview = (overrides: Partial<PromoteDatabasePreview> = {}): PromoteDatabasePreview => ({
  addon,
  appIdentity: 'myapp',
  attachment,
  ...overrides,
})

const result = (overrides: Partial<PromoteDatabaseResult> = {}): PromoteDatabaseResult => ({
  addon,
  attachment,
  mutationStatus: {
    attachment: {attempted: true, status: 'created'},
    backupAttachment: {attempted: false, status: 'not_attempted'},
    poolerAttachment: {attempted: false, status: 'not_attempted'},
  },
  ...overrides,
})

interface FakeData {
  database: {
    promote: SinonStub
    waitStatus: SinonStub
  }
}

const promoteWith = (
  promotionResult: PromoteDatabaseResult,
  promotionPreview: PromoteDatabasePreview = preview({currentAttachment: {...alias, name: 'DATABASE'}, existingAlias: alias}),
  customizeOptions?: (options: PromoteDatabaseOptions) => void,
) =>
  async (_app: string, _database?: string, options: PromoteDatabaseOptions = {}) => {
    customizeOptions?.(options)
    await options.beforePromote?.(promotionPreview)
    if (promotionResult.backupAttachment) await options.onBackupAttachment?.(promotionResult.backupAttachment)

    return promotionResult
  }

describe('pg:promote', function () {
  let fakeData: FakeData

  beforeEach(function () {
    fakeData = {database: {promote: stub(), waitStatus: stub().resolves({message: 'available', 'waiting?': false})}}
    stub(HerokuSDK.prototype, 'data').get(() => fakeData)
  })

  afterEach(function () {
    restore()
  })

  it('promotes a database and returns the SDK result', async function () {
    const promotionResult = result()
    fakeData.database.promote.callsFake(promoteWith(promotionResult, undefined, options => {
      expect(options.force).to.equal(true)
    }))

    const {result: commandResult, stderr, stdout} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(fakeData.database.promote.calledOnce).to.equal(true)
    expect(fakeData.database.promote.firstCall.args[0]).to.equal('myapp')
    expect(fakeData.database.promote.firstCall.args[1]).to.equal('DATABASE')
    expect(fakeData.database.waitStatus.calledOnceWithExactly(addon.id)).to.equal(true)
    expect(commandResult).to.equal(promotionResult)
    expect(stdout).to.equal('')
    expect(stderr).to.contain('Promoting ⛁ dwh-db to ⛁ DATABASE_URL on ⬢ myapp... done')
  })

  it('preserves custom attachment names', async function () {
    fakeData.database.promote.callsFake(promoteWith(result(), undefined, options => {
      expect(options.as).to.equal('CUSTOM_DB')
    }))

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', '--as', 'CUSTOM_DB', 'DATABASE'])

    expect(stderr).to.contain('Promoting ⛁ dwh-db to ⛁ DATABASE_URL on ⬢ myapp... done')
  })

  it('promotes when the app has no DATABASE attachment', async function () {
    const promotionResult = result()
    fakeData.database.promote.callsFake(promoteWith(promotionResult, preview()))

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', 'dwh-db'])

    expect(stderr).to.contain('Ensuring an alternate alias for existing ⛁ DATABASE_URL... Promoting ⛁ dwh-db to ⛁ DATABASE_URL on ⬢ myapp... done')
  })

  it('uses an existing alias for the current DATABASE without creating a backup', async function () {
    fakeData.database.promote.callsFake(promoteWith(result(), preview({
      currentAttachment: {...alias, name: 'DATABASE'},
      existingAlias: alias,
    })))

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(stderr).to.contain('Ensuring an alternate alias for existing ⛁ DATABASE_URL... RED_URL')
    expect(stderr).to.not.contain('GREEN_URL')
  })

  it('preserves the backup alias before checking readiness', async function () {
    const events: string[] = []
    const promotionResult = result({
      backupAttachment: backup,
      mutationStatus: {
        attachment: {attempted: true, status: 'created'},
        backupAttachment: {attempted: true, status: 'created'},
        poolerAttachment: {attempted: false, status: 'not_attempted'},
      },
    })
    fakeData.database.waitStatus.callsFake(async () => {
      events.push('ready')
      return {message: 'available', 'waiting?': false}
    })
    fakeData.database.promote.callsFake(async (_app: string, _database: string, options: PromoteDatabaseOptions) => {
      await options.beforePromote?.(preview({currentAttachment: {...alias, name: 'DATABASE'}}))
      events.push('backup-created')
      await options.onBackupAttachment?.(backup)
      return promotionResult
    })

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(events).to.deep.equal(['backup-created', 'ready'])
    expect(stderr).to.contain('Ensuring an alternate alias for existing ⛁ DATABASE_URL... GREEN_URL')
    expect(stderr).to.contain('Promoting ⛁ dwh-db to ⛁ DATABASE_URL on ⬢ myapp... done')
  })

  it('creates a backup alias when the current DATABASE has none', async function () {
    const promotionResult = result({
      backupAttachment: backup,
      mutationStatus: {
        attachment: {attempted: true, status: 'created'},
        backupAttachment: {attempted: true, status: 'created'},
        poolerAttachment: {attempted: false, status: 'not_attempted'},
      },
    })
    fakeData.database.promote.callsFake(async (_app: string, _database: string, options: PromoteDatabaseOptions) => {
      await options.beforePromote?.(preview({currentAttachment: {...alias, name: 'DATABASE'}}))
      await options.onBackupAttachment?.(backup)
      return promotionResult
    })

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(stderr).to.contain('Ensuring an alternate alias for existing ⛁ DATABASE_URL... GREEN_URL')
    expect(stderr).to.contain('Promoting ⛁ dwh-db to ⛁ DATABASE_URL on ⬢ myapp... done')
  })

  it('reattaches a default pooler from the old leader', async function () {
    const promotionResult = result({
      mutationStatus: {
        attachment: {attempted: true, status: 'created'},
        backupAttachment: {attempted: false, status: 'not_attempted'},
        poolerAttachment: {attempted: true, status: 'created'},
      },
      poolerAttachment: pooler,
    })
    fakeData.database.promote.callsFake(promoteWith(promotionResult))

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(stderr).to.contain('Reattaching pooler to new leader... done')
  })

  it('does not reattach a pooler when SDK result has no pooler attachment', async function () {
    const promotionResult = result()
    fakeData.database.promote.callsFake(promoteWith(promotionResult))

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(stderr).to.not.contain('Reattaching pooler')
  })

  it('does not promote a database that is already DATABASE', async function () {
    const alreadyPromoted = new DatabaseAlreadyPromotedError('myapp', addon, attachment)
    fakeData.database.promote.rejects(alreadyPromoted)

    const {error} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(ansis.strip(error!.message)).to.equal('dwh-db is already promoted on ⬢ myapp')
  })

  it('preserves already-promoted credential attachment output', async function () {
    const credential = {...attachment, name: 'PURPLE', namespace: 'credential:hello'}
    const alreadyPromoted = new DatabaseAlreadyPromotedError('myapp', addon, credential)
    fakeData.database.promote.rejects(alreadyPromoted)

    const {error} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(ansis.strip(error!.message)).to.equal('PURPLE is already promoted on ⬢ myapp')
  })

  it('promotes credential attachments without changing their namespace', async function () {
    const credential = {...attachment, name: 'PURPLE', namespace: 'credential:hello'}
    const promotionResult = result({attachment: credential})
    fakeData.database.promote.callsFake(async (_app: string, _database: string, options: PromoteDatabaseOptions) => {
      await options.beforePromote?.(preview({attachment: credential, existingAlias: alias}))
      return promotionResult
    })

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(stderr).to.contain('Promoting PURPLE to ⛁ DATABASE_URL on ⬢ myapp... done')
  })

  it('warns when the promoted database remains a follower', async function () {
    const promotionResult = result({database: {following: 'postgres://leader', leader: 'postgresql-leader'}})
    fakeData.database.promote.callsFake(promoteWith(promotionResult))

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(stderr).to.contain('Your database has been promoted but it is currently a follower')
    expect(stderr).to.contain('heroku pg:unfollow dwh-db')
    expect(stderr).to.contain('postgresql-leader')
  })

  it('waits for release-phase polling before warning that the promoted database remains a follower', async function () {
    let resolvePromotion!: (promotionResult: PromoteDatabaseResult) => void
    let promoteStarted!: () => void
    const promotionStarted = new Promise<void>(resolve => {
      promoteStarted = resolve
    })
    const promotionResult = result({
      database: {following: 'postgres://leader', leader: 'postgresql-leader'},
      releasePhase: {status: 'succeeded'} as PromoteDatabaseResult['releasePhase'],
    })
    const pendingPromotion = new Promise<PromoteDatabaseResult>(resolve => {
      resolvePromotion = resolve
    })
    const followerWarning = stub(ux, 'warn').callThrough()
    fakeData.database.promote.callsFake(async (_app: string, _database: string, options: PromoteDatabaseOptions) => {
      await options.beforePromote?.(preview())
      promoteStarted()
      return pendingPromotion
    })

    const command = runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])
    await promotionStarted
    expect(fakeData.database.promote.calledOnce).to.equal(true)
    expect(followerWarning.called).to.equal(false)

    resolvePromotion(promotionResult)
    const {stderr} = await command

    expect(stderr).to.contain('Promoting ⛁ dwh-db to ⛁ DATABASE_URL on ⬢ myapp... done')
    expect(stderr).to.contain('Your database has been promoted but it is currently a follower')
    expect(stderr.indexOf('Your database has been promoted')).to.be.lessThan(stderr.indexOf('Checking release phase... pg:promote succeeded.'))
    expect(followerWarning.calledOnce).to.equal(true)
  })

  it('checks release phase and preserves detach-failure messaging', async function () {
    const promotionResult = result({
      releasePhase: {
        attach: {description: 'Attach DATABASE', id: 'release-1', status: 'succeeded'},
        detach: {description: 'Detach DATABASE', id: 'release-2', status: 'failed'},
        status: 'succeeded',
      } as PromoteDatabaseResult['releasePhase'],
    })
    fakeData.database.promote.callsFake(promoteWith(promotionResult))

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(stderr).to.contain('Checking release phase... pg:promote succeeded. It is safe to ignore the failed Detach DATABASE release.')
  })

  it('preserves attach-failure message when detach also failed', async function () {
    const promotionResult = result({
      releasePhase: {
        attach: {description: 'Attach DATABASE', id: 'release-1', status: 'failed'},
        detach: {description: 'Detach DATABASE', id: 'release-2', status: 'failed'},
        status: 'failed',
      } as PromoteDatabaseResult['releasePhase'],
    })
    fakeData.database.promote.callsFake(promoteWith(promotionResult))

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(stderr).to.contain('pg:promote failed because Attach DATABASE release was unsuccessful. Your application is currently running with postgres-2 attached as DATABASE_URL.'
      + ' Check your release phase logs for failure causes.')
  })

  it('preserves attach-failure message when detach succeeded', async function () {
    const promotionResult = result({
      releasePhase: {
        attach: {description: 'Attach DATABASE', id: 'release-1', status: 'failed'},
        detach: {description: 'Detach DATABASE', id: 'release-2', status: 'succeeded'},
        status: 'failed',
      } as PromoteDatabaseResult['releasePhase'],
    })
    fakeData.database.promote.callsFake(promoteWith(promotionResult))

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(stderr).to.contain('Your application is currently running without an attached DATABASE_URL.')
  })

  it('preserves release-phase timeout as a successful message', async function () {
    const promotionResult = result({releasePhase: {status: 'timed_out'} as PromoteDatabaseResult['releasePhase']})
    fakeData.database.promote.callsFake(promoteWith(promotionResult))

    const {error, stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(error).to.be.undefined
    expect(stderr).to.contain('Checking release phase... timeout. Check your Attach DATABASE release for failures.')
  })

  it('uses generic CLI text when SDK rejects for a missing Attach DATABASE release', async function () {
    const cause = new DatabaseReleasePhaseError('myapp')
    fakeData.database.promote.rejects(new DatabasePromotionError(result({releasePhase: {status: 'unknown'} as PromoteDatabaseResult['releasePhase']}), cause))

    expect(cause.message).to.equal('Unable to check release phase for myapp. Check your Attach DATABASE release for failures.')

    const {error} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(ansis.strip(error!.message)).to.equal('Unable to check release phase. Check your Attach DATABASE release for failures.')
  })

  it('reports the app name for a fulfilled result with unknown release-phase status', async function () {
    fakeData.database.promote.callsFake(promoteWith(result({releasePhase: {status: 'unknown'} as PromoteDatabaseResult['releasePhase']})))

    const {error} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(ansis.strip(error!.message)).to.equal('Unable to check release phase for myapp. Check your Attach DATABASE release for failures.')
  })

  it('creates backup alias before rejecting a database that is not ready', async function () {
    const events: string[] = []
    const notReady = new DatabaseNotReadyError({message: 'pending', 'waiting?': true})
    fakeData.database.waitStatus.callsFake(async () => {
      events.push('readiness')
      throw notReady
    })
    fakeData.database.promote.callsFake(async (_app: string, _database: string, options: PromoteDatabaseOptions) => {
      await options.beforePromote?.(preview({currentAttachment: {...alias, name: 'DATABASE'}}))
      events.push('backup')
      try {
        await options.onBackupAttachment?.(backup)
      } catch (error) {
        throw new DatabasePromotionError(result({backupAttachment: backup}), error)
      }

      return result()
    })

    const {error} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(events).to.deep.equal(['backup', 'readiness'])
    expect(ansis.strip(error!.message)).to.equal(heredoc(`
      Database cannot be promoted while in state: pending

      Promoting this database can lead to application errors and outage. Please run heroku pg:wait to wait for database to become available.

      To ignore this error, you can pass the --force flag to promote the database and risk application issues.
    `))
  })

  it('skips readiness checks with --force', async function () {
    const promotionResult = result()
    fakeData.database.promote.callsFake(promoteWith(promotionResult, undefined, options => {
      expect(options.force).to.equal(true)
    }))

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', '--force', 'DATABASE'])

    expect(fakeData.database.waitStatus.called).to.equal(false)
    expect(stderr).to.contain('Promoting ⛁ dwh-db to ⛁ DATABASE_URL on ⬢ myapp... done')
  })

  it('does not promote when an SDK mutation fails and preserves the failure cause', async function () {
    const cause = new Error('attachment create failed')
    const partial = result({
      mutationStatus: {
        attachment: {attempted: true, status: 'unknown'},
        backupAttachment: {attempted: false, status: 'not_attempted'},
        poolerAttachment: {attempted: false, status: 'not_attempted'},
      },
    })
    fakeData.database.promote.callsFake(async (_app: string, _database: string, options: PromoteDatabaseOptions) => {
      await options.beforePromote?.(preview({existingAlias: alias}))
      throw new DatabasePromotionError(partial, cause)
    })

    const {error, stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(error).to.equal(cause)
    expect(stderr).to.contain('Promoting ⛁ dwh-db to ⛁ DATABASE_URL on ⬢ myapp...')
    expect(stderr).to.contain('Promoting ⛁ dwh-db to ⛁ DATABASE_URL on ⬢ myapp... !')
    expect(stderr).to.not.contain('Promoting ⛁ dwh-db to ⛁ DATABASE_URL on ⬢ myapp... done')
  })

  it('stops the pooler spinner with failure indication when its mutation status is unknown', async function () {
    const cause = new Error('pooler attachment status unknown')
    const partial = result({
      mutationStatus: {
        attachment: {attempted: true, status: 'created'},
        backupAttachment: {attempted: false, status: 'not_attempted'},
        poolerAttachment: {attempted: true, status: 'unknown'},
      },
      poolerAttachment: pooler,
    })
    fakeData.database.promote.callsFake(async (_app: string, _database: string, options: PromoteDatabaseOptions) => {
      await options.beforePromote?.(preview({existingAlias: alias}))
      throw new DatabasePromotionError(partial, cause)
    })

    const {error, stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(error).to.equal(cause)
    expect(stderr).to.contain('Reattaching pooler to new leader... !')
    expect(stderr).to.not.contain('Reattaching pooler to new leader... done')
  })

  it('stops the backup alias spinner with failure indication when its mutation status is unknown', async function () {
    const cause = new Error('backup attachment status unknown')
    const partial = result({
      mutationStatus: {
        attachment: {attempted: false, status: 'not_attempted'},
        backupAttachment: {attempted: true, status: 'unknown'},
        poolerAttachment: {attempted: false, status: 'not_attempted'},
      },
    })
    fakeData.database.promote.rejects(new DatabasePromotionError(partial, cause))

    const {error, stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(error).to.equal(cause)
    expect(stderr).to.contain('Ensuring an alternate alias for existing ⛁ DATABASE_URL... !')
    expect(stderr).to.not.contain('Ensuring an alternate alias for existing ⛁ DATABASE_URL... done')
  })

  it('retains namespace-sensitive credential promotion behavior', async function () {
    const currentCredential = {...attachment, name: 'DATABASE', namespace: 'credential:goodbye'}
    const promotedCredential = {...attachment, name: 'PURPLE', namespace: 'credential:hello'}
    const promotionResult = result({attachment: promotedCredential})
    fakeData.database.promote.callsFake(async (_app: string, _database: string, options: PromoteDatabaseOptions) => {
      await options.beforePromote?.(preview({attachment: promotedCredential, currentAttachment: currentCredential, existingAlias: alias}))
      return promotionResult
    })

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(stderr).to.contain('Promoting PURPLE to ⛁ DATABASE_URL on ⬢ myapp... done')
  })

  it('uses the default credential alias when replacing a default DATABASE on the same add-on', async function () {
    const defaultAlias = makeAttachment({
      addon, id: 'default-alias', name: 'RED', namespace: null,
    })
    const credential = {...attachment, name: 'PURPLE', namespace: 'credential:hello'}
    fakeData.database.promote.callsFake(promoteWith(result({attachment: credential}), preview({
      attachment: credential,
      currentAttachment: attachment,
      existingAlias: defaultAlias,
    })))

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(stderr).to.contain('Ensuring an alternate alias for existing ⛁ DATABASE_URL... RED_URL')
    expect(stderr).to.contain('Promoting PURPLE to ⛁ DATABASE_URL on ⬢ myapp... done')
  })

  it('uses the existing credential alias when replacing a different credential on the same add-on', async function () {
    const credentialAlias = makeAttachment({
      addon, id: 'credential-alias', name: 'BLUE', namespace: 'credential:goodbye',
    })
    const currentCredential = {...attachment, name: 'DATABASE', namespace: 'credential:goodbye'}
    const credential = {...attachment, name: 'PURPLE', namespace: 'credential:hello'}
    fakeData.database.promote.callsFake(promoteWith(result({attachment: credential}), preview({
      attachment: credential,
      currentAttachment: currentCredential,
      existingAlias: credentialAlias,
    })))

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(stderr).to.contain('Ensuring an alternate alias for existing ⛁ DATABASE_URL... BLUE_URL')
    expect(stderr).to.contain('Promoting PURPLE to ⛁ DATABASE_URL on ⬢ myapp... done')
  })
})
