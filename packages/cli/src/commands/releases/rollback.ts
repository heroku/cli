import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {findByPreviousOrId} from '../../lib/releases/releases'
import {stream} from '../../lib/releases/output'

export default class Rollback extends Command {
  static topic = 'releases'
  static hiddenAliases = ['rollback']
  static description = `Roll back to a previous release.

    If RELEASE is not specified, it will roll back to the last eligible release.
    `
  static flags = {
    remote: flags.remote(),
    app: flags.app({required: true}),
  }

  static args = {
    release: Args.string({description: 'ID of the release. If omitted, we use the last eligible release.'}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Rollback)
    const {app} = flags
    const release = await findByPreviousOrId(this.heroku, app, args.release)

    if (!release) {
      ux.error(`No eligible release found for ${color.app(app)} to roll back to.`)
    }

    ux.action.start(`Rolling back ${color.app(app)} to ${color.green('v' + release.version)}`)
    const {body: latest} = await this.heroku.post<Heroku.Release>(`/apps/${app}/releases`, {
      body: {
        release: release.id,
      },
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      },
    })
    const streamUrl = latest.output_stream_url
    ux.action.stop(`done, ${color.green('v' + latest.version)}`)
    ux.warn("Rollback affects code and config vars; it doesn't add or remove addons.")
    if (latest.version) {
      ux.warn(`To undo, run: ${color.cyan.bold('heroku rollback v' + (latest.version - 1))}`)
    }

    if (streamUrl) {
      ux.log('Running release command...')
      await stream(streamUrl)
        .catch(error => {
          if (error.statusCode === 404 || error.response?.statusCode === 404) {
            ux.warn('Release command starting. Use `heroku releases:output` to view the log.')
            return
          }

          throw error
        })
    }
  }
}
