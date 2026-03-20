import {Command} from '@heroku-cli/command'
import {BuildpackRegistry} from '@heroku/buildpack-registry'
import {hux} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'
import {Result} from 'true-myth'

export default class Info extends Command {
  static args = {
    buildpack: Args.string({
      description: 'namespace/name of the buildpack',
      required: true,
    }),
  }

  static description = 'fetch info about a buildpack'

  async run() {
    const {args} = await this.parse(Info)
    const registry = new BuildpackRegistry()

    const validationResult = BuildpackRegistry.isValidBuildpackSlug(args.buildpack)
    if (!validationResult.isOk) {
      this.error(`Could not publish the buildpack.\n${(validationResult as any).error}`)
    }

    const result = await registry.info(args.buildpack)
    Result.match({
      Err(err: any) {
        if (err.status === 404) {
          ux.error(`Could not find the buildpack '${args.buildpack}'`)
        } else {
          ux.error(`Problems finding buildpack info: ${err.description}`)
        }
      },
      Ok(buildpack: unknown) {
        hux.styledHeader(args.buildpack)
        hux.styledObject(buildpack, ['description', 'category', 'license', 'support', 'source', 'readme'])
      },
    }, result as any)
  }
}
