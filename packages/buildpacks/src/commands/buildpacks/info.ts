import {Command} from '@heroku-cli/command'
import {BuildpackRegistry} from '@heroku/buildpack-registry'
import {cli} from 'cli-ux'
import {Result} from 'true-myth'

export default class Info extends Command {
  static description = 'fetch info about a buildpack'
  static args = [
    {
      name: 'buildpack',
      required: true,
      description: 'namespace/name of the buildpack'
    }
  ]

  async run() {
    let {args} = this.parse(Info)
    let registry = new BuildpackRegistry()

    Result.match({
      Ok: _ => {},
      Err: err => {
        this.error(`Could not publish the buildpack.\n${err}`)
      },
    }, BuildpackRegistry.isValidBuildpackSlug(args.buildpack))

    let result = await registry.info(args.buildpack)
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
      }
    }, result)
  }
}
