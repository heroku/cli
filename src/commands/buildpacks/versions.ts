import {Command} from '@heroku-cli/command'
import {BuildpackRegistry, RevisionBody} from '@heroku/buildpack-registry'
import {hux} from '@heroku/heroku-cli-util'
import {Args} from '@oclif/core'
import {ux} from '@oclif/core/ux'

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
    if (validationResult.isErr) {
      ux.error(`Could not find '${args.buildpack}'.\n${validationResult.error}`)
    }

    const result = await registry.listVersions(args.buildpack)
    result.match({
      Err(err) {
        if (err.status === 404) {
          ux.error(`Could not find '${args.buildpack}'`)
        } else {
          ux.error(`Problem fetching versions, ${err.status}: ${err.description}`)
        }
      },
      Ok(versions) {
        /* eslint-disable perfectionist/sort-objects */
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
        /* eslint-enable perfectionist/sort-objects */
      },
    })
  }
}
