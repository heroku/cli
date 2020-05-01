import {Command} from '@heroku-cli/command'
import {cli} from 'cli-ux'
import {Result} from 'true-myth'

import {BuildpackRegistry, RevisionBody} from '@heroku/buildpack-registry'

export default class Versions extends Command {
  static description = 'list versions of a buildpack'

  static args = [
    {
      name: 'buildpack',
      required: true,
      description: 'namespace/name of the buildpack',
    },
  ]

  async run() {
    const {args} = this.parse(Versions)
    const herokuAuth = this.heroku.auth || ''
    if (herokuAuth === '') {
      this.error('You need to be logged in to run this command.')
    }
    const registry = new BuildpackRegistry()

    Result.match({
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      Ok: _ => {},
      Err: err => {
        this.error(`Could not find the buildpack.\n${err}`)
      },
    }, BuildpackRegistry.isValidBuildpackSlug(args.buildpack))

    const result = await registry.listVersions(args.buildpack)
    Result.match({
      Ok: versions => {
        cli.table(versions.sort((a: RevisionBody, b: RevisionBody) => {
          return a.release > b.release ? -1 : 1
        }), {
          columns: [
            {key: 'release', label: 'Version'},
            {key: 'created_at', label: 'Released At'},
            {key: 'status', label: 'Status'},
          ],
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
