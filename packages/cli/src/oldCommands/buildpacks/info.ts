/*
import {Command} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'
import {Result} from 'true-myth'

import {BuildpackRegistry} from '@heroku/buildpack-registry'

export default class Info extends Command {
  static description = 'fetch info about a buildpack'

  static args = {
    buildpack: Args.string({
      required: true,
      description: 'namespace/name of the buildpack',
    }),
  }

  async run() {
    const {args} = await this.parse(Info)
    const registry = new BuildpackRegistry()

    const validationResult = BuildpackRegistry.isValidBuildpackSlug(args.buildpack)
    if (!validationResult.isOk) {
      this.error(`Could not publish the buildpack.\n${(validationResult as any).error}`)
    }

    const result = await registry.info(args.buildpack)
    Result.match({
      Ok: (buildpack: unknown) => {
        hux.styledHeader(args.buildpack)
        hux.styledObject(buildpack, ['description', 'category', 'license', 'support', 'source', 'readme'])
      },
      Err: (err: any) => {
        if (err.status === 404) {
          ux.error(`Could not find the buildpack '${args.buildpack}'`)
        } else {
          ux.error(`Problems finding buildpack info: ${err.description}`)
        }
      },
    }, result as any)
  }
}
*/
