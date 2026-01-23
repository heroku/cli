import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

import {stream} from '../../lib/releases/output.js'
import {findByLatestOrId} from '../../lib/releases/releases.js'

export default class Retry extends Command {
  static description = 'retry the latest release-phase command'
  static examples = ['heroku releases:retry --app happy-samurai-42']
  static flags = {
    app: flags.app({required: true}),
  }

  static help = 'Copies the latest release into a new release and retries the latest release-phase command. App must have a release-phase command.'

  static topic = 'releases'

  public async run(): Promise<void> {
    const {flags} = await this.parse(Retry)
    const {app} = flags
    const release = await findByLatestOrId(this.heroku, app)
    const {body: formations} = await this.heroku.get<Heroku.Formation[]>(`/apps/${app}/formation`)
    const releasePhase = formations.filter(formation => formation.type === 'release')

    if (!release) {
      return ux.error(`No release found for ${color.app(app)}.`)
    }

    if (releasePhase.length === 0) {
      return ux.error('App must have a release-phase command to use this command.')
    }

    ux.action.start(`Retrying ${color.name('v' + release.version)} on ${color.app(app)}`)

    const {body: retry} = await this.heroku.post<Heroku.Release>(`/apps/${app}/releases`, {
      body: {
        description: `Retry of v${release.version}: ${release.description}`,
        slug: release?.slug?.id,
      },
    })

    ux.action.stop(`done, ${color.name('v' + retry.version)}`)

    if (retry.output_stream_url) {
      ux.stdout('Running release command...')
      await stream(retry.output_stream_url)
        .catch(error => {
          if (error.statusCode === 404 || error.response?.statusCode === 404) {
            ux.warn(`Release command starting. Use ${color.code('heroku releases:output --app ' + app)} to view the log.`)
            return
          }

          throw error
        })
    }
  }
}

