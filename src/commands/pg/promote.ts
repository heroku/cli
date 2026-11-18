import {Command, flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {
  DatabaseAlreadyPromotedError,
  databaseCommandExtensions,
  DatabasePromotionError,
  DatabaseReleasePhaseError,
  type PromoteDatabaseOptions,
  type PromoteDatabasePartialResult,
  type PromoteDatabasePreview,
  type PromoteDatabaseProgressEvent,
  type PromoteDatabaseResult,
} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {createSDK} from '../../lib/sdk.js'
import {nls} from '../../nls.js'

const heredoc = tsheredoc
const alternateAliasMessage = `Ensuring an alternate alias for existing ${color.datastore('DATABASE_URL')}`
const releasePhaseMessage = 'Checking release phase'
const releasePhaseUnknownMessage = (app: string) =>
  `Unable to check release phase for ${app}. Check your Attach DATABASE release for failures.`
const progressEventKey = (event: PromoteDatabaseProgressEvent) =>
  `${event.type}:${event.stage}:${'status' in event ? event.status : ''}`
const progressStageKey = (event: PromoteDatabaseProgressEvent) => `${event.type}:${event.stage}`
const isTerminalProgressEvent = (event: PromoteDatabaseProgressEvent) => {
  if (event.type === 'attachment' || event.type === 'pooler-reattachment') return event.status !== 'started'
  if (event.type === 'release-phase') return event.stage === 'completed' || event.status === 'not_required'

  return event.type === 'database'
}

const isStartedProgressEvent = (event: PromoteDatabaseProgressEvent) =>
  (event.type === 'attachment' || event.type === 'pooler-reattachment')
    ? event.status === 'started'
    : event.type === 'release-phase' && event.stage === 'started'
const isProgressStageActive = (
  event: PromoteDatabaseProgressEvent,
  state: {alias: boolean; pooler: boolean; promotion: boolean; releasePhase: boolean},
) => {
  if (event.type === 'attachment') return event.stage === 'backup' ? state.alias : state.promotion
  if (event.type === 'pooler-reattachment') return state.pooler
  if (event.type === 'release-phase') return state.releasePhase

  return false
}

export default class Promote extends Command {
  static args = {
    database: Args.string({description: nls('pg:database:arg:description'), required: true}),
  }
  static description = 'sets DATABASE as your DATABASE_URL'
  static flags = {
    app: flags.app({required: true}),
    as: flags.string({description: 'name for the database attachment'}),
    force: flags.boolean({char: 'f'}),
    remote: flags.remote(),
  }
  static topic = 'pg'

  public async run() {
    const {args, flags} = await this.parse(Promote)
    const {app, as, force} = flags
    const {data} = createSDK(this.heroku, {extensions: [databaseCommandExtensions]})
    let preview: PromoteDatabasePreview | undefined
    let promotionMessage = ''
    let aliasSpinnerActive = false
    let promotionSpinnerActive = false
    let poolerSpinnerActive = false
    let releasePhaseSpinnerActive = false
    let releasePhaseUnknownPending = false
    let followerWarningShown = false
    const observedProgressEvents = new Set<string>()
    const completedProgressStages = new Set<string>()

    const startPromotion = () => {
      ux.action.start(promotionMessage)
      promotionSpinnerActive = true
    }

    const displayFollowerWarning = (database: PromoteDatabasePartialResult['database']) => {
      if (!followerWarningShown && preview && database?.following) {
        this.displayFollowerWarning({addon: preview.addon, database})
        followerWarningShown = true
      }
    }

    // eslint-disable-next-line complexity -- process the SDK's progress union in operation order
    const onProgress = (event: PromoteDatabaseProgressEvent) => {
      observedProgressEvents.add(progressEventKey(event))
      if (isTerminalProgressEvent(event)) completedProgressStages.add(progressStageKey(event))

      if (event.type === 'attachment') {
        if (event.stage === 'backup') {
          if (event.status === 'started' && !aliasSpinnerActive) {
            ux.action.start(alternateAliasMessage)
            aliasSpinnerActive = true
          } else if (event.status === 'succeeded' && aliasSpinnerActive) {
            ux.action.stop(event.attachment ? color.attachment(`${event.attachment.name}_URL`) : undefined)
            aliasSpinnerActive = false
          } else if (event.status === 'unknown' && aliasSpinnerActive) {
            ux.action.stop(color.red('!'))
            aliasSpinnerActive = false
          }
        }

        if (event.stage === 'promotion') {
          if (event.status === 'started') {
            startPromotion()
          } else if (event.status === 'succeeded' && promotionSpinnerActive) {
            ux.action.stop()
            promotionSpinnerActive = false
          } else if (event.status === 'unknown' && promotionSpinnerActive) {
            ux.action.stop(color.red('!'))
            promotionSpinnerActive = false
          }
        }

        return
      }

      if (event.type === 'database') {
        displayFollowerWarning(event.database)
        return
      }

      if (event.type === 'pooler-reattachment') {
        if (event.status === 'started') {
          ux.action.start('Reattaching pooler to new leader')
          poolerSpinnerActive = true
        } else if (poolerSpinnerActive) {
          ux.action.stop(event.status === 'succeeded' ? undefined : color.red('!'))
          poolerSpinnerActive = false
        }

        return
      }

      if (event.stage === 'started') {
        ux.action.start(releasePhaseMessage)
        releasePhaseSpinnerActive = true
      } else if (event.stage === 'poll') {
        if (!releasePhaseSpinnerActive) {
          ux.action.start(releasePhaseMessage)
          releasePhaseSpinnerActive = true
        }

        ux.action.status = event.status
      } else if (event.status === 'not_required') {
        if (releasePhaseSpinnerActive) ux.action.stop()
        releasePhaseSpinnerActive = false
      } else if (event.stage === 'completed' && event.status === 'unknown') {
        // The SDK reports unknown before its promise rejects with the release-phase error.
        // Keep the spinner open until the settled result identifies the user-facing outcome.
        releasePhaseUnknownPending = true
      } else {
        this.displayReleasePhaseProgress(event, preview)
        releasePhaseSpinnerActive = false
      }
    }

    const replayProgress = (
      result: PromoteDatabasePartialResult,
      options: {isPartialFailure?: boolean; releasePhaseError?: boolean} = {},
    ) => { // eslint-disable-line complexity -- reconcile each operation result with observed SDK progress
      const {mutationStatus, releasePhase} = result
      const events: PromoteDatabaseProgressEvent[] = []

      if (mutationStatus.backupAttachment.attempted) {
        events.push({stage: 'backup', status: 'started', type: 'attachment'}, {
          attachment: result.backupAttachment,
          stage: 'backup',
          status: mutationStatus.backupAttachment.status === 'created' ? 'succeeded' : 'unknown',
          type: 'attachment',
        })
      } else if (aliasSpinnerActive) {
        events.push({
          stage: 'backup',
          status: options.isPartialFailure ? 'unknown' : 'succeeded',
          type: 'attachment',
        })
      }

      if (mutationStatus.attachment.attempted) {
        events.push({stage: 'promotion', status: 'started', type: 'attachment'}, {
          attachment: result.attachment,
          stage: 'promotion',
          status: mutationStatus.attachment.status === 'created' ? 'succeeded' : 'unknown',
          type: 'attachment',
        })
      }

      if (mutationStatus.poolerAttachment.attempted) {
        events.push({stage: 'reattachment', status: 'started', type: 'pooler-reattachment'}, {
          attachment: result.poolerAttachment,
          stage: 'reattachment',
          status: mutationStatus.poolerAttachment.status === 'created' ? 'succeeded' : 'unknown',
          type: 'pooler-reattachment',
        })
      }

      if (result.database) events.push({database: result.database, stage: 'resolved', type: 'database'})

      if (releasePhase) {
        events.push({stage: 'started', status: 'started', type: 'release-phase'})
        if (options.isPartialFailure !== true || releasePhase.status !== 'unknown') {
          events.push({
            attach: releasePhase.attach,
            detach: releasePhase.detach,
            stage: 'completed',
            status: releasePhase.status,
            type: 'release-phase',
          })
        }
      } else if (options.releasePhaseError) {
        events.push({stage: 'started', status: 'started', type: 'release-phase'})
      }

      for (const event of events) {
        const stageKey = progressStageKey(event)
        if (observedProgressEvents.has(progressEventKey(event))) continue
        if (isStartedProgressEvent(event) && (completedProgressStages.has(stageKey) || isProgressStageActive(event, {
          alias: aliasSpinnerActive,
          pooler: poolerSpinnerActive,
          promotion: promotionSpinnerActive,
          releasePhase: releasePhaseSpinnerActive,
        }))) continue
        if (isTerminalProgressEvent(event) && completedProgressStages.has(stageKey)) continue

        onProgress(event)
      }
    }

    const finishReleasePhaseError = () => {
      const failureMessage = releasePhaseUnknownMessage(app)
      if (aliasSpinnerActive || promotionSpinnerActive || poolerSpinnerActive || releasePhaseSpinnerActive) {
        ux.action.stop(failureMessage)
      } else {
        ux.action.start(releasePhaseMessage)
        ux.action.stop(failureMessage)
      }

      aliasSpinnerActive = false
      promotionSpinnerActive = false
      poolerSpinnerActive = false
      releasePhaseSpinnerActive = false
      releasePhaseUnknownPending = false
    }

    const options: PromoteDatabaseOptions = {
      as,
      async beforePromote(currentPreview) {
        preview = currentPreview
        const {addon, attachment} = currentPreview
        promotionMessage = attachment.namespace
          ? `Promoting ${color.attachment(attachment.name)} to ${color.datastore('DATABASE_URL')} on ${color.app(app)}`
          : `Promoting ${color.datastore(addon.name)} to ${color.datastore('DATABASE_URL')} on ${color.app(app)}`

        if (currentPreview.currentAttachment) {
          ux.action.start(alternateAliasMessage)
          aliasSpinnerActive = true
          if (currentPreview.existingAlias) {
            ux.action.stop(color.attachment(`${currentPreview.existingAlias.name}_URL`))
            aliasSpinnerActive = false
          }
        }
      },
      force: Boolean(force),
      onProgress,
    }

    let result: PromoteDatabaseResult
    try {
      result = await data.database.promoteForApp(app, args.database, options)
      replayProgress(result)
      displayFollowerWarning(result.database)
    } catch (error) {
      if (error instanceof DatabaseAlreadyPromotedError) {
        if (error.attachment.namespace) {
          ux.error(`${color.attachment(error.attachment.name)} is already promoted on ${color.app(app)}`)
        } else {
          ux.error(`${color.addon(error.addon.name)} is already promoted on ${color.app(app)}`)
        }
      }

      if (error instanceof DatabasePromotionError) {
        const releasePhaseUnknown = error.cause instanceof DatabaseReleasePhaseError
          || error.result.releasePhase?.status === 'unknown'
          || releasePhaseUnknownPending
        replayProgress(error.result, {
          isPartialFailure: true,
          releasePhaseError: error.cause instanceof DatabaseReleasePhaseError,
        })

        if (releasePhaseUnknown) {
          finishReleasePhaseError()
        } else if (aliasSpinnerActive || promotionSpinnerActive || poolerSpinnerActive || releasePhaseSpinnerActive) {
          ux.action.stop(color.red('!'))
        }

        displayFollowerWarning(error.result.database)

        throw error.cause
      }

      if (releasePhaseUnknownPending) {
        finishReleasePhaseError()
      }

      throw error
    }

    if (result.releasePhase?.status === 'unknown') {
      finishReleasePhaseError()
      ux.error(releasePhaseUnknownMessage(app))
    }

    return result
  }

  private displayFollowerWarning(result: Pick<PromoteDatabasePartialResult, 'addon' | 'database'>) {
    if (!result.database?.following) return

    const unfollowLeaderCmd = `heroku pg:unfollow ${result.addon.name}`
    ux.warn(heredoc(`
      Your database has been promoted but it is currently a follower database in read-only mode.

      Promoting a database with ${color.code('heroku pg:promote')} doesn't automatically unfollow its leader.

      Use ${color.code(unfollowLeaderCmd)} to stop this follower from replicating from its leader (${color.datastore(result.database.leader as string)}) and convert it into a writable database.
    `))
  }

  private displayReleasePhaseProgress(
    event: Extract<PromoteDatabaseProgressEvent, {type: 'release-phase'}>,
    preview: PromoteDatabasePreview | undefined,
  ) {
    if (event.status === 'succeeded') {
      let message = 'pg:promote succeeded.'
      if (event.detach?.status === 'failed') {
        message += ` It is safe to ignore the failed ${event.detach.description} release.`
      }

      ux.action.stop(message)
      return
    }

    if (event.status === 'failed') {
      let message = `pg:promote failed because ${event.attach?.description} release was unsuccessful. Your application is currently running `
      const detachSucceeded = event.detach?.status === 'succeeded'
      message += detachSucceeded
        ? 'without an attached DATABASE_URL.'
        : `with ${preview?.currentAttachment?.addon.name} attached as DATABASE_URL.`

      message += ' Check your release phase logs for failure causes.'
      ux.action.stop(message)
      return
    }

    if (event.status === 'timed_out') {
      ux.action.stop('timeout. Check your Attach DATABASE release for failures.')
      return
    }

    ux.action.stop(color.red('!'))
  }
}
