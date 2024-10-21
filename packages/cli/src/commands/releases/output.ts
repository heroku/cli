import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {findByLatestOrId} from '../../lib/releases/releases'
import {stream} from '../../lib/releases/output'

export default class Output extends Command {
    static topic = 'releases';
    static description = 'View the release command output';
    static flags = {
      remote: flags.remote(),
      app: flags.app({required: true}),
    };

    static args = {
      release: Args.string({description: 'The ID of the release. If omitted, the last release is used.'}),
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
          if (error.statusCode === 404 || error.response?.statusCode === 404) {
            ux.warn('Release command not started yet. Please try again in a few seconds.')
            return
          }

          throw error
        })
    }
}
