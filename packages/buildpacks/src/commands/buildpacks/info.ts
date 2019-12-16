import {Command} from '@heroku-cli/command'
import {cli} from 'cli-ux'
import {Result} from 'true-myth'

import {BuildpackRegistry} from '@heroku/buildpack-registry'

export default class Info extends Command {
  static description = 'fetch info about a buildpack'

  static args = [
    {
      name: 'buildpack',
      required: true,
      description: 'namespace/name of the buildpack',
    },
  ]

  async run() {
    const {args} = this.parse(Info)
    const registry = new BuildpackRegistry()

    Result.match({
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      Ok: _ => {},
      Err: err => {
        this.error(`Could not publish the buildpack.\n${err}`)
      },
    }, BuildpackRegistry.isValidBuildpackSlug(args.buildpack))

    const result = await registry.info(args.buildpack)
    Result.match({
      Ok: buildpack => {
        cli.styledHeader(args.buildpack)
        cli.styledObject(buildpack, ['description', 'category', 'license', 'support', 'source', 'readme'])
      },
      Err: err => {
        if (err.status === 404) {
          cli.error(`Could not find the buildpack '${args.buildpack}'`)
        } else {
          cli.error(`Problems finding buildpack info: ${err.description}`)
        }
      },
    }, result)
  }
}
