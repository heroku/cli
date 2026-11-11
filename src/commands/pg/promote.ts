import {Command, flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {
  DatabaseAlreadyPromotedError,
  databaseCommandExtensions,
  DatabaseNotReadyError,
  DatabasePromotionError,
  DatabaseReleasePhaseError,
  type PromoteDatabaseOptions,
  type PromoteDatabasePartialResult,
  type PromoteDatabasePreview,
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

    const checkReadiness = async (addon: PromoteDatabasePreview['addon']) => {
      if (force) return

      const status = await data.database.waitStatus(addon.id)
      if (status['waiting?']) {
        ux.error(heredoc(`
          Database cannot be promoted while in state: ${status.message}

          Promoting this database can lead to application errors and outage. Please run ${color.code('heroku pg:wait')} to wait for database to become available.

          To ignore this error, you can pass the --force flag to promote the database and risk application issues.
        `))
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

        if (currentPreview.existingAlias) {
          ux.action.stop(color.attachment(`${currentPreview.existingAlias.name}_URL`))
        }

        if (!currentPreview.currentAttachment || currentPreview.existingAlias) {
          await checkReadiness(addon)
          ux.action.start(promotionMessage)
        }
      },
      // The SDK's built-in readiness check runs before its callbacks. Skip it so
      // the legacy alias-first order can be retained with our callback check.
      force: true,
      async onBackupAttachment(backup) {
        ux.action.stop(color.attachment(`${backup.name}_URL`))
        if (preview) {
          await checkReadiness(preview.addon)
          ux.action.start(promotionMessage)
        }
      },
    }

    ux.action.start(`Ensuring an alternate alias for existing ${color.datastore('DATABASE_URL')}`)

    try {
      const result = await data.database.promote(app, args.database, options)
      this.displayPromotionResult(result, preview, app)
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
        this.displayPartialPromotion(error.result, preview, app, error.cause)
        if (error.cause instanceof DatabaseNotReadyError) {
          this.errorIfNotReady(error.cause)
        }

        if (error.cause instanceof DatabaseReleasePhaseError) {
          ux.error('Unable to check release phase. Check your Attach DATABASE release for failures.')
        }

        throw error.cause
      }

      if (error instanceof DatabaseNotReadyError) this.errorIfNotReady(error)

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

  private displayPartialPromotion(result: PromoteDatabasePartialResult, preview: PromoteDatabasePreview | undefined, app: string, cause: unknown) {
    if (result.mutationStatus.attachment.status === 'created') {
      ux.action.stop()
    }

    this.displayPoolerResult(result)
    if (result.database?.following) this.displayFollowerWarning(result)

    if (cause instanceof DatabaseReleasePhaseError || result.releasePhase?.status === 'unknown') {
      ux.action.start('Checking release phase')
    }

    if (result.releasePhase && result.releasePhase.status !== 'unknown') {
      this.displayReleasePhase(result, preview, app)
    }
  }

  private displayPoolerResult(result: Pick<PromoteDatabaseResult, 'mutationStatus' | 'poolerAttachment'>) {
    if (!result.mutationStatus.poolerAttachment.attempted) return

    ux.action.start('Reattaching pooler to new leader')
    if (result.mutationStatus.poolerAttachment.status === 'created') ux.action.stop()
  }

  private displayPromotionResult(result: PromoteDatabaseResult, preview: PromoteDatabasePreview | undefined, app: string) {
    ux.action.stop()
    this.displayPoolerResult(result)
    this.displayFollowerWarning(result)
    this.displayReleasePhase(result, preview, app)
  }

  private displayReleasePhase(result: Pick<PromoteDatabasePartialResult, 'releasePhase'>, preview: PromoteDatabasePreview | undefined, app: string) {
    const {releasePhase} = result
    if (!releasePhase) return

    ux.action.start('Checking release phase')
    if (releasePhase.status === 'succeeded') {
      let message = 'pg:promote succeeded.'
      if (releasePhase.detach?.status === 'failed') {
        message += ` It is safe to ignore the failed ${releasePhase.detach.description} release.`
      }

      ux.action.stop(message)
      return
    }

    if (releasePhase.status === 'failed') {
      let message = `pg:promote failed because ${releasePhase.attach?.description} release was unsuccessful. Your application is currently running `
      const detachSucceeded = releasePhase.detach?.status === 'succeeded'
      message += detachSucceeded
        ? 'without an attached DATABASE_URL.'
        : `with ${preview?.currentAttachment?.addon.name} attached as DATABASE_URL.`

      message += ' Check your release phase logs for failure causes.'
      ux.action.stop(message)
      return
    }

    if (releasePhase.status === 'timed_out') {
      ux.action.stop('timeout. Check your Attach DATABASE release for failures.')
      return
    }

    ux.error(`Unable to check release phase for ${app}. Check your Attach DATABASE release for failures.`)
  }

  private errorIfNotReady(error: DatabaseNotReadyError): never {
    ux.error(heredoc(`
      Database cannot be promoted while in state: ${error.status.message}

      Promoting this database can lead to application errors and outage. Please run ${color.code('heroku pg:wait')} to wait for database to become available.

      To ignore this error, you can pass the --force flag to promote the database and risk application issues.
    `))
  }
}
