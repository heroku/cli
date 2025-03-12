import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import color from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {streamer} from '../../lib/container/streamer'
import {findByLatestOrId} from '../../lib/releases/releases'

export default class Retry extends Command {
    static topic = 'releases';
    static description = 'retry the latest release-phase command';
    static examples = ['heroku releases:retry --app happy-samurai-42']
    static help = 'Copies the latest release into a new one, retrying the latest release-phase command.'
    static flags = {
      app: flags.app({required: true}),
    };

    public async run(): Promise<void> {
      const {flags} = await this.parse(Retry)
      const {app} = flags
      const release = await findByLatestOrId(this.heroku, app)

      if (!release) {
        return ux.error('No release found for this app')
      }

      ux.action.start(`Retrying ${color.green('v' + release.version)} on ${color.app(app)}`)

      const {body: retry} = await this.heroku.post<Heroku.Release>(`/apps/${app}/releases`, {
        body: {
          slug: release?.slug?.id,
          description: `Retry of v${release.version}: ${release.description}`
        }
      })

      ux.action.stop(`done, ${color.green('v' + retry.version)}`)

      if (retry.output_stream_url) {
        ux.log('Running release command...')
        try {
          await streamer(retry.output_stream_url, process.stdout)
        } catch (error: any) {
          if (error.statusCode === 404) {
            ux.warn('Release command starting. Use `heroku releases:output` to view the log.')
            return
          }

          throw error
        }
      }
    }
}
