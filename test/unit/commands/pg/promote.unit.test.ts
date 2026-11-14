import type {AddOnAttachment, Release} from '@heroku/types/3.sdk'

import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {
  DatabaseAlreadyPromotedError,
  DatabaseNotReadyError,
  DatabasePromotionError,
  DatabaseReleasePhaseError,
  type PromoteDatabaseOptions,
  type PromoteDatabasePreview,
  type PromoteDatabaseProgressEvent,
  type PromoteDatabaseResult,
} from '@heroku/sdk/extensions/data'
import {ux} from '@oclif/core'
import ansis from 'ansis'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'

import Cmd from '../../../../src/commands/pg/promote.js'

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
    info: SinonStub
    promoteForApp: SinonStub
  }
}

const emitProgressForResult = async (options: PromoteDatabaseOptions, promotionResult: PromoteDatabaseResult) => {
  const {mutationStatus, releasePhase} = promotionResult
  const progress: PromoteDatabaseProgressEvent[] = []

  if (mutationStatus.backupAttachment.attempted) {
    progress.push({stage: 'backup', status: 'started', type: 'attachment'}, {
      attachment: promotionResult.backupAttachment,
      stage: 'backup',
      status: mutationStatus.backupAttachment.status === 'created' ? 'succeeded' : 'unknown',
      type: 'attachment',
    })
  }

  if (mutationStatus.attachment.attempted) {
    progress.push({stage: 'promotion', status: 'started', type: 'attachment'}, {
      attachment: promotionResult.attachment,
      stage: 'promotion',
      status: mutationStatus.attachment.status === 'created' ? 'succeeded' : 'unknown',
      type: 'attachment',
    })
  }

  if (mutationStatus.poolerAttachment.attempted) {
    progress.push({stage: 'reattachment', status: 'started', type: 'pooler-reattachment'}, {
      attachment: promotionResult.poolerAttachment,
      stage: 'reattachment',
      status: mutationStatus.poolerAttachment.status === 'created' ? 'succeeded' : 'unknown',
      type: 'pooler-reattachment',
    })
  }

  if (releasePhase) {
    progress.push({stage: 'started', status: 'started', type: 'release-phase'}, {
      attach: releasePhase.attach,
      detach: releasePhase.detach,
      stage: 'completed',
      status: releasePhase.status,
      type: 'release-phase',
    })
  }

  // eslint-disable-next-line no-await-in-loop -- preserve the SDK progress order
  for (const event of progress) await options.onProgress?.(event)
}

const promoteWith = (
  promotionResult: PromoteDatabaseResult,
  promotionPreview: PromoteDatabasePreview = preview({currentAttachment: {...alias, name: 'DATABASE'}, existingAlias: alias}),
  customizeOptions?: (options: PromoteDatabaseOptions) => void,
) =>
  async (_app: string, _database?: string, options: PromoteDatabaseOptions = {}) => {
    customizeOptions?.(options)
    await options.beforePromote?.(promotionPreview)
    await emitProgressForResult(options, promotionResult)

    return promotionResult
  }

describe('pg:promote', function () {
  let fakeData: FakeData

  beforeEach(function () {
    fakeData = {database: {info: stub().resolves({}), promoteForApp: stub()}}
    stub(HerokuSDK.prototype, 'data').get(() => fakeData)
  })

  afterEach(function () {
    restore()
  })

  it('promotes a database and returns the SDK result', async function () {
    const promotionResult = result()
    fakeData.database.promoteForApp.callsFake(promoteWith(promotionResult, undefined, options => {
      expect(options.force).to.equal(false)
    }))

    const {result: commandResult, stderr, stdout} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(fakeData.database.promoteForApp.calledOnce).to.equal(true)
    expect(fakeData.database.promoteForApp.firstCall.args[0]).to.equal('myapp')
    expect(fakeData.database.promoteForApp.firstCall.args[1]).to.equal('DATABASE')
    expect(commandResult).to.equal(promotionResult)
    expect(stdout).to.equal('')
    expect(stderr).to.contain('Promoting ⛁ dwh-db to ⛁ DATABASE_URL on ⬢ myapp... done')
  })

  it('preserves custom attachment names', async function () {
    fakeData.database.promoteForApp.callsFake(promoteWith(result(), undefined, options => {
      expect(options.as).to.equal('CUSTOM_DB')
    }))

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', '--as', 'CUSTOM_DB', 'DATABASE'])

    expect(stderr).to.contain('Promoting ⛁ dwh-db to ⛁ DATABASE_URL on ⬢ myapp... done')
  })

  it('promotes when the app has no DATABASE attachment', async function () {
    const promotionResult = result()
    fakeData.database.promoteForApp.callsFake(promoteWith(promotionResult, preview()))

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', 'dwh-db'])

    expect(stderr).to.contain('Promoting ⛁ dwh-db to ⛁ DATABASE_URL on ⬢ myapp... done')
    expect(stderr).to.not.contain('Ensuring an alternate alias')
  })

  it('rejects an unready database before creating an alias for the existing DATABASE', async function () {
    const notReady = new DatabaseNotReadyError({message: 'pending', 'waiting?': true})
    fakeData.database.promoteForApp.rejects(notReady)

    const {error, stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(error).to.equal(notReady)
    expect(fakeData.database.promoteForApp.firstCall.args[2].force).to.equal(false)
    expect(stderr).to.not.contain('Ensuring an alternate alias')
    expect(stderr).to.not.contain('Promoting ⛁ dwh-db')
  })

  it('uses --force to proceed through backup and promotion progress', async function () {
    const promotionResult = result({backupAttachment: backup})
    fakeData.database.promoteForApp.callsFake(async (_app: string, _database: string, options: PromoteDatabaseOptions) => {
      expect(options.force).to.equal(true)
      await options.beforePromote?.(preview({currentAttachment: {...alias, name: 'DATABASE'}}))
      await options.onProgress?.({stage: 'backup', status: 'started', type: 'attachment'})
      await options.onProgress?.({
        attachment: backup, stage: 'backup', status: 'succeeded', type: 'attachment',
      })
      await options.onProgress?.({stage: 'promotion', status: 'started', type: 'attachment'})
      await options.onProgress?.({
        attachment, stage: 'promotion', status: 'succeeded', type: 'attachment',
      })
      return promotionResult
    })

    const {error, stderr} = await runCommand(Cmd, ['--app', 'myapp', '--force', 'DATABASE'])

    expect(error).to.be.undefined
    expect(stderr).to.contain('Ensuring an alternate alias for existing ⛁ DATABASE_URL... GREEN_URL')
    expect(stderr).to.contain('Promoting ⛁ dwh-db to ⛁ DATABASE_URL on ⬢ myapp... done')
  })

  it('does not show an alias spinner when database resolution fails', async function () {
    fakeData.database.promoteForApp.rejects(new Error('Database not found'))

    const {error, stderr} = await runCommand(Cmd, ['--app', 'myapp', 'missing-database'])

    expect(error!.message).to.equal('Database not found')
    expect(stderr).to.not.contain('Ensuring an alternate alias')
    expect(stderr).to.not.contain('Promoting ⛁ dwh-db')
  })

  it('uses an existing alias for the current DATABASE without creating a backup', async function () {
    fakeData.database.promoteForApp.callsFake(promoteWith(result(), preview({
      currentAttachment: {...alias, name: 'DATABASE'},
      existingAlias: alias,
    })))

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(stderr).to.contain('Ensuring an alternate alias for existing ⛁ DATABASE_URL... RED_URL')
    expect(stderr).to.not.contain('GREEN_URL')
  })

  it('renders backup alias and promotion updates from live SDK progress', async function () {
    const events: string[] = []
    const promotionResult = result({
      backupAttachment: backup,
      mutationStatus: {
        attachment: {attempted: true, status: 'created'},
        backupAttachment: {attempted: true, status: 'created'},
        poolerAttachment: {attempted: false, status: 'not_attempted'},
      },
    })
    fakeData.database.promoteForApp.callsFake(async (_app: string, _database: string, options: PromoteDatabaseOptions) => {
      await options.beforePromote?.(preview({currentAttachment: {...alias, name: 'DATABASE'}}))
      events.push('backup-created')
      await options.onProgress?.({stage: 'backup', status: 'started', type: 'attachment'})
      await options.onProgress?.({
        attachment: backup, stage: 'backup', status: 'succeeded', type: 'attachment',
      })
      await options.onProgress?.({stage: 'promotion', status: 'started', type: 'attachment'})
      await options.onProgress?.({
        attachment, stage: 'promotion', status: 'succeeded', type: 'attachment',
      })
      return promotionResult
    })

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(events).to.deep.equal(['backup-created'])
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
    fakeData.database.promoteForApp.callsFake(async (_app: string, _database: string, options: PromoteDatabaseOptions) => {
      await options.beforePromote?.(preview({currentAttachment: {...alias, name: 'DATABASE'}}))
      await options.onProgress?.({stage: 'backup', status: 'started', type: 'attachment'})
      await options.onProgress?.({
        attachment: backup, stage: 'backup', status: 'succeeded', type: 'attachment',
      })
      await options.onProgress?.({stage: 'promotion', status: 'started', type: 'attachment'})
      await options.onProgress?.({
        attachment, stage: 'promotion', status: 'succeeded', type: 'attachment',
      })
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
    fakeData.database.promoteForApp.callsFake(promoteWith(promotionResult))

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(stderr).to.contain('Reattaching pooler to new leader... done')
  })

  it('does not reattach a pooler when SDK result has no pooler attachment', async function () {
    const promotionResult = result()
    fakeData.database.promoteForApp.callsFake(promoteWith(promotionResult))

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(stderr).to.not.contain('Reattaching pooler')
  })

  it('does not promote a database that is already DATABASE', async function () {
    const alreadyPromoted = new DatabaseAlreadyPromotedError('myapp', addon, attachment)
    fakeData.database.promoteForApp.rejects(alreadyPromoted)

    const {error} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(ansis.strip(error!.message)).to.equal('dwh-db is already promoted on ⬢ myapp')
  })

  it('preserves already-promoted credential attachment output', async function () {
    const credential = {...attachment, name: 'PURPLE', namespace: 'credential:hello'}
    const alreadyPromoted = new DatabaseAlreadyPromotedError('myapp', addon, credential)
    fakeData.database.promoteForApp.rejects(alreadyPromoted)

    const {error} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(ansis.strip(error!.message)).to.equal('PURPLE is already promoted on ⬢ myapp')
  })

  it('promotes credential attachments without changing their namespace', async function () {
    const credential = {...attachment, name: 'PURPLE', namespace: 'credential:hello'}
    const promotionResult = result({attachment: credential})
    fakeData.database.promoteForApp.callsFake(async (_app: string, _database: string, options: PromoteDatabaseOptions) => {
      await options.beforePromote?.(preview({attachment: credential, existingAlias: alias}))
      return promotionResult
    })

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(stderr).to.contain('Promoting PURPLE to ⛁ DATABASE_URL on ⬢ myapp... done')
  })

  it('warns when the promoted database remains a follower', async function () {
    const promotionResult = result({database: {following: 'postgres://leader', leader: 'postgresql-leader'}})
    fakeData.database.promoteForApp.callsFake(promoteWith(promotionResult))

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(stderr).to.contain('Your database has been promoted but it is currently a follower')
    expect(stderr).to.contain('heroku pg:unfollow dwh-db')
    expect(stderr).to.contain('postgresql-leader')
  })

  it('shows follower warning when promotion progress reports attachment success before release polling', async function () {
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
    fakeData.database.info.resolves({following: 'postgres://leader', leader: 'postgresql-leader'})
    fakeData.database.promoteForApp.callsFake(async (_app: string, _database: string, options: PromoteDatabaseOptions) => {
      await options.beforePromote?.(preview())
      await options.onProgress?.({stage: 'promotion', status: 'started', type: 'attachment'})
      await options.onProgress?.({
        attachment, stage: 'promotion', status: 'succeeded', type: 'attachment',
      })
      await options.onProgress?.({
        database: {following: 'postgres://leader', leader: 'postgresql-leader'},
        stage: 'resolved',
        type: 'database',
      })
      await options.onProgress?.({stage: 'started', status: 'started', type: 'release-phase'})
      await options.onProgress?.({
        attach: {id: 'release-1', status: 'pending'} as Release,
        stage: 'poll', status: 'pending', type: 'release-phase',
      })
      await options.onProgress?.({
        attach: {id: 'release-1', status: 'succeeded'} as Release,
        stage: 'completed', status: 'succeeded', type: 'release-phase',
      })
      promoteStarted()
      return pendingPromotion
    })

    const command = runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])
    await promotionStarted
    expect(fakeData.database.promoteForApp.calledOnce).to.equal(true)
    expect(followerWarning.calledOnce).to.equal(true)

    resolvePromotion(promotionResult)
    const {stderr} = await command

    expect(stderr).to.contain('Your database has been promoted but it is currently a follower')
    expect(stderr).to.contain('Checking release phase')
    expect(stderr).to.contain('pg:promote succeeded.')
    expect(stderr.split('pg:promote succeeded.')).to.have.length(2)
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
    fakeData.database.promoteForApp.callsFake(promoteWith(promotionResult))

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
    fakeData.database.promoteForApp.callsFake(promoteWith(promotionResult))

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
    fakeData.database.promoteForApp.callsFake(promoteWith(promotionResult))

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(stderr).to.contain('Your application is currently running without an attached DATABASE_URL.')
  })

  it('preserves release-phase timeout as a successful message', async function () {
    const promotionResult = result({releasePhase: {status: 'timed_out'} as PromoteDatabaseResult['releasePhase']})
    fakeData.database.promoteForApp.callsFake(promoteWith(promotionResult))

    const {error, stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(error).to.be.undefined
    expect(stderr).to.contain('Checking release phase... timeout. Check your Attach DATABASE release for failures.')
  })

  it('uses generic CLI text when SDK rejects for a missing Attach DATABASE release', async function () {
    const cause = new DatabaseReleasePhaseError('myapp')
    fakeData.database.promoteForApp.rejects(new DatabasePromotionError(result({releasePhase: {status: 'unknown'} as PromoteDatabaseResult['releasePhase']}), cause))

    expect(cause.message).to.equal('Unable to check release phase for myapp. Check your Attach DATABASE release for failures.')

    const {error} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(ansis.strip(error!.message)).to.equal('Unable to check release phase. Check your Attach DATABASE release for failures.')
  })

  it('reports the app name for a fulfilled result with unknown release-phase status', async function () {
    fakeData.database.promoteForApp.callsFake(promoteWith(result({releasePhase: {status: 'unknown'} as PromoteDatabaseResult['releasePhase']})))

    const {error} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(ansis.strip(error!.message)).to.equal('Unable to check release phase for myapp. Check your Attach DATABASE release for failures.')
  })

  it('skips readiness checks with --force', async function () {
    const promotionResult = result()
    fakeData.database.promoteForApp.callsFake(promoteWith(promotionResult, undefined, options => {
      expect(options.force).to.equal(true)
    }))

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', '--force', 'DATABASE'])

    expect(fakeData.database.promoteForApp.firstCall.args[2].force).to.equal(true)
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
    fakeData.database.promoteForApp.callsFake(async (_app: string, _database: string, options: PromoteDatabaseOptions) => {
      await options.beforePromote?.(preview({existingAlias: alias}))
      throw new DatabasePromotionError(partial, cause)
    })

    const {error, stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(error).to.equal(cause)
    expect(stderr).to.contain('Promoting ⛁ dwh-db to ⛁ DATABASE_URL on ⬢ myapp...')
    expect(stderr).to.contain('Promoting ⛁ dwh-db to ⛁ DATABASE_URL on ⬢ myapp... !')
    expect(stderr).to.not.contain('Promoting ⛁ dwh-db to ⛁ DATABASE_URL on ⬢ myapp... done')
  })

  it('stops the active progress spinner when a mutation fails after progress starts', async function () {
    const cause = new Error('attachment create failed')
    const partial = result({
      mutationStatus: {
        attachment: {attempted: true, status: 'unknown'},
        backupAttachment: {attempted: false, status: 'not_attempted'},
        poolerAttachment: {attempted: false, status: 'not_attempted'},
      },
    })
    fakeData.database.promoteForApp.callsFake(async (_app: string, _database: string, options: PromoteDatabaseOptions) => {
      await options.beforePromote?.(preview())
      await options.onProgress?.({stage: 'promotion', status: 'started', type: 'attachment'})
      throw new DatabasePromotionError(partial, cause)
    })

    const {error, stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(error).to.equal(cause)
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
    fakeData.database.promoteForApp.callsFake(async (_app: string, _database: string, options: PromoteDatabaseOptions) => {
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
    fakeData.database.promoteForApp.callsFake(async (_app: string, _database: string, options: PromoteDatabaseOptions) => {
      await options.beforePromote?.(preview({currentAttachment: {...alias, name: 'DATABASE'}}))
      throw new DatabasePromotionError(partial, cause)
    })

    const {error, stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(error).to.equal(cause)
    expect(stderr).to.contain('Ensuring an alternate alias for existing ⛁ DATABASE_URL... !')
    expect(stderr).to.not.contain('Ensuring an alternate alias for existing ⛁ DATABASE_URL... done')
  })

  it('retains namespace-sensitive credential promotion behavior', async function () {
    const currentCredential = {...attachment, name: 'DATABASE', namespace: 'credential:goodbye'}
    const promotedCredential = {...attachment, name: 'PURPLE', namespace: 'credential:hello'}
    const promotionResult = result({attachment: promotedCredential})
    fakeData.database.promoteForApp.callsFake(async (_app: string, _database: string, options: PromoteDatabaseOptions) => {
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
    fakeData.database.promoteForApp.callsFake(promoteWith(result({attachment: credential}), preview({
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
    fakeData.database.promoteForApp.callsFake(promoteWith(result({attachment: credential}), preview({
      attachment: credential,
      currentAttachment: currentCredential,
      existingAlias: credentialAlias,
    })))

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(stderr).to.contain('Ensuring an alternate alias for existing ⛁ DATABASE_URL... BLUE_URL')
    expect(stderr).to.contain('Promoting PURPLE to ⛁ DATABASE_URL on ⬢ myapp... done')
  })
})
