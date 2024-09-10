import {Command} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
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
      this.error('You need to be logged in to run this command.')
    }

    const registry = new BuildpackRegistry()

    Result.match({
      Ok: () => {},
      Err: err => {
        this.error(`Could not find the buildpack.\n${err}`)
      },
    }, BuildpackRegistry.isValidBuildpackSlug(args.buildpack))

    const result = await registry.listVersions(args.buildpack)
    Result.match({
      Ok: versions => {
        ux.table(versions.sort((a: RevisionBody, b: RevisionBody) => {
          return a.release > b.release ? -1 : 1
        }), {
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
      Err: err => {
        if (err.status === 404) {
          this.error(`Could not find '${args.buildpack}'`)
        } else {
          this.error(`Problem fetching versions, ${err.status}: ${err.description}`)
        }
      },
    }, result)
  }
}
