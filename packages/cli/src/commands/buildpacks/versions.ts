import {Command} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core'
import {Result} from 'true-myth'

import {BuildpackRegistry, RevisionBody} from '@heroku/buildpack-registry'

export default class Versions extends Command {
  static description = 'list versions of a buildpack'

  static args = {
    buildpack: Args.string({
      required: true,
      description: 'namespace/name of the buildpack',
    }),
  }

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
      Ok(versions: RevisionBody[]) {
        hux.table(versions.sort((a: RevisionBody, b: RevisionBody) => a.release > b.release ? -1 : 1), {
          release: {
            header: 'Version',
          },
          created_at: {
            header: 'Released At',
          },
          status: {
            header: 'Status',
          },
        })
      },
      Err(err: any) {
        if (err.status === 404) {
          ux.error(`Could not find '${args.buildpack}'`)
        } else {
          ux.error(`Problem fetching versions, ${err.status}: ${err.description}`)
        }
      },
    }, result as any)
  }
}
