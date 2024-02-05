import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {findByLatestOrId} from '../../lib/releases/releases'
import {stream} from '../../lib/releases/output'

export default class Output extends Command {
    static topic = 'releases';
    static description = 'View the release command output';
    static flags = {
      app: flags.app({required: true}),
    };

    static args = {
      release: Args.string(),
    };

    public async run(): Promise<void> {
      const {flags, args} = await this.parse(Output)
      const {app} = flags
      const release = await findByLatestOrId(this.heroku, app, args.release)
      const streamUrl = release.output_stream_url

      if (!streamUrl) {
        ux.warn(`Release v${release.version} has no release output available.`)
        return
      }

      await stream(streamUrl)
        .catch(error => {
          if (error.statusCode === 404) {
            ux.warn('Release command not started yet. Please try again in a few seconds.')
            return
          }

          throw error
        })
    }
}
