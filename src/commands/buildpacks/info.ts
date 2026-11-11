import {Command, flags as Flags} from '@heroku-cli/command'
import {BuildpackRegistry} from '@heroku/buildpack-registry'
import {hux} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'

export default class Info extends Command {
  static args = {
    buildpack: Args.string({
      description: 'namespace/name of the buildpack',
      required: true,
    }),
  }
  static description = 'fetch info about a buildpack'
  static flags = {
    json: Flags.boolean({char: 'j', description: 'output in json format'}),
  }

  async run() {
    const {args, flags} = await this.parse(Info)
    const registry = new BuildpackRegistry()

    const validationResult = BuildpackRegistry.isValidBuildpackSlug(args.buildpack)
    if (validationResult.isErr) {
      this.error(`Could not find the buildpack '${args.buildpack}'.\n${validationResult.error}`)
    }

    const result = await registry.info(args.buildpack)
    result.match({
      Err(err) {
        if (err.status === 404) {
          ux.error(`Could not find the buildpack '${args.buildpack}'`)
        } else {
          ux.error(`Problems finding buildpack info: ${err.description}`)
        }
      },
      Ok(buildpack) {
        if (flags.json) {
          hux.styledJSON(buildpack)
        } else {
          if (buildpack.archived) {
            ux.warn('This buildpack has been archived.')
          }

          hux.styledHeader(args.buildpack)
          hux.styledObject(buildpack, ['description', 'category', 'license', 'support', 'source', 'readme'])
        }
      },
    })
  }
}
