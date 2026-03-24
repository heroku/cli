import {Command} from '@heroku-cli/command'
import {BuildpackRegistry, RevisionBody} from '@heroku/buildpack-registry'
import * as hux from '@heroku/heroku-cli-util/hux'
import {Args, ux} from '@oclif/core'
import {Result} from 'true-myth'

export default class Versions extends Command {
  static args = {
    buildpack: Args.string({
      description: 'namespace/name of the buildpack',
      required: true,
    }),
  }

  static description = 'list versions of a buildpack'

  async run() {
    const {args} = await this.parse(Versions)
    const herokuAuth = this.heroku.auth || ''
    if (herokuAuth === '') {
      ux.error('You need to be logged in to run this command.')
    }

    const registry = new BuildpackRegistry()

    const validationResult = BuildpackRegistry.isValidBuildpackSlug(args.buildpack)
    if (!validationResult.isOk) {
      ux.error(`Could not find the buildpack.\n${(validationResult as any).error}`)
    }

    const result = await registry.listVersions(args.buildpack)
    Result.match({
      Err(err: any) {
        if (err.status === 404) {
          ux.error(`Could not find '${args.buildpack}'`)
        } else {
          ux.error(`Problem fetching versions, ${err.status}: ${err.description}`)
        }
      },
      Ok(versions: RevisionBody[]) {
        hux.table(versions.sort((a: RevisionBody, b: RevisionBody) => a.release > b.release ? -1 : 1), {
          created_at: {
            header: 'Released At',
          },
          release: {
            header: 'Version',
          },
          status: {
            header: 'Status',
          },
        })
      },
    }, result as any)
  }
}
