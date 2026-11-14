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
    let progressEventsSeen = false
    let aliasSpinnerActive = false
    let promotionSpinnerActive = false
    let poolerSpinnerActive = false
    let releasePhaseSpinnerActive = false
    let followerWarningShown = false

    const alternateAliasMessage = `Ensuring an alternate alias for existing ${color.datastore('DATABASE_URL')}`
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
      progressEventsSeen = true

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
        ux.action.start('Checking release phase')
        releasePhaseSpinnerActive = true
      } else if (event.stage === 'poll') {
        if (!releasePhaseSpinnerActive) {
          ux.action.start('Checking release phase')
          releasePhaseSpinnerActive = true
        }

        ux.action.status = event.status
      } else if (event.status === 'not_required') {
        if (releasePhaseSpinnerActive) ux.action.stop()
        releasePhaseSpinnerActive = false
      } else {
        this.displayReleasePhaseProgress(event, preview)
        releasePhaseSpinnerActive = false
      }
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

    try {
      const result = await data.database.promoteForApp(app, args.database, options)
      if (progressEventsSeen) displayFollowerWarning(result.database)
      else {
        if (aliasSpinnerActive) {
          ux.action.stop(result.backupAttachment ? color.attachment(`${result.backupAttachment.name}_URL`) : undefined)
          aliasSpinnerActive = false
        }

        if (!promotionSpinnerActive && promotionMessage) ux.action.start(promotionMessage)
        this.displayPromotionResult(result, preview)
      }

      if (result.releasePhase?.status === 'unknown') {
        ux.error(`Unable to check release phase for ${app}. Check your Attach DATABASE release for failures.`)
      }

      return result
    } catch (error) {
      if (error instanceof DatabaseAlreadyPromotedError) {
        if (error.attachment.namespace) {
          ux.error(`${color.attachment(error.attachment.name)} is already promoted on ${color.app(app)}`)
        } else {
          ux.error(`${color.addon(error.addon.name)} is already promoted on ${color.app(app)}`)
        }
      }

      if (error instanceof DatabasePromotionError) {
        displayFollowerWarning(error.result.database)
        if (!progressEventsSeen) {
          this.displayPartialPromotion(error.result, {
            aliasSpinnerActive,
            cause: error.cause,
            preview,
            promotionMessage,
            promotionSpinnerActive,
          })
        } else if (aliasSpinnerActive || promotionSpinnerActive || poolerSpinnerActive || releasePhaseSpinnerActive) {
          ux.action.stop(color.red('!'))
        }

        if (error.cause instanceof DatabaseReleasePhaseError) {
          ux.error('Unable to check release phase. Check your Attach DATABASE release for failures.')
        }

        throw error.cause
      }

      throw error
    }
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

  private displayPartialPromotion(
    result: PromoteDatabasePartialResult,
    context: {
      aliasSpinnerActive: boolean
      cause: unknown
      preview: PromoteDatabasePreview | undefined
      promotionMessage: string
      promotionSpinnerActive: boolean
    },
  ) {
    const {aliasSpinnerActive, cause, preview, promotionMessage, promotionSpinnerActive} = context
    const {attachment, backupAttachment} = result.mutationStatus
    if (attachment.attempted) {
      if (!promotionSpinnerActive) ux.action.start(promotionMessage)

      if (attachment.status === 'created') {
        ux.action.stop()
      } else {
        ux.action.stop(color.red('!'))
      }
    } else if (backupAttachment.attempted && backupAttachment.status !== 'created') {
      if (!aliasSpinnerActive) ux.action.start(`Ensuring an alternate alias for existing ${color.datastore('DATABASE_URL')}`)
      ux.action.stop(color.red('!'))
    }

    this.displayPoolerResult(result)
    if (result.database?.following) this.displayFollowerWarning(result)

    if (cause instanceof DatabaseReleasePhaseError || result.releasePhase?.status === 'unknown') {
      ux.action.start('Checking release phase')
    }

    if (result.releasePhase && result.releasePhase.status !== 'unknown') {
      this.displayReleasePhaseProgress({
        attach: result.releasePhase.attach,
        detach: result.releasePhase.detach,
        stage: 'completed',
        status: result.releasePhase.status,
        type: 'release-phase',
      }, preview)
    }
  }

  private displayPoolerResult(result: Pick<PromoteDatabaseResult, 'mutationStatus' | 'poolerAttachment'>) {
    if (!result.mutationStatus.poolerAttachment.attempted) return

    ux.action.start('Reattaching pooler to new leader')
    if (result.mutationStatus.poolerAttachment.status === 'created') {
      ux.action.stop()
    } else {
      ux.action.stop(color.red('!'))
    }
  }

  private displayPromotionResult(result: PromoteDatabaseResult, preview: PromoteDatabasePreview | undefined) {
    ux.action.stop()
    this.displayPoolerResult(result)
    this.displayFollowerWarning(result)
    if (result.releasePhase) {
      ux.action.start('Checking release phase')
      this.displayReleasePhaseProgress({
        attach: result.releasePhase.attach,
        detach: result.releasePhase.detach,
        stage: 'completed',
        status: result.releasePhase.status,
        type: 'release-phase',
      }, preview)
    }
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
