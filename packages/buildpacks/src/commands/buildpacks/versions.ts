import {Command} from '@heroku-cli/command'
import {BuildpackRegistry, RevisionBody} from '@heroku/buildpack-registry'
import {cli} from 'cli-ux'
import {Result} from 'true-myth'

export default class Versions extends Command {
  static description = 'list versions of a buildpack'
  static args = [
    {
      name: 'buildpack',
      required: true,
      description: 'namespace/name of the buildpack'
    }
  ]

  async run() {
    let {args} = this.parse(Versions)
    let registry: BuildpackRegistry
    let herokuAuth = this.heroku.auth || ''
    if (herokuAuth === '') {
      this.error('You need to be logged in to run this command.')
    }
    registry = new BuildpackRegistry()

    Result.match({
      Ok: _ => {},
      Err: err => {
        this.error(`Could not find the buildpack.\n${err}`)
      },
    }, BuildpackRegistry.isValidBuildpackSlug(args.buildpack))

    let result = await registry.listVersions(args.buildpack)
    Result.match({
      Ok: versions => {
        cli.table(versions.sort((a: RevisionBody, b: RevisionBody) => {
          return a.release > b.release ? -1 : 1
        }), {
          columns: [
            {key: 'release', label: 'Version'},
            {key: 'created_at', label: 'Released At'},
            {key: 'status', label: 'Status'}
          ]
        })
      },
      Err: err => {
        if (err.status === 404) {
          this.error(`Could not find '${args.buildpack}'`)
        } else {
          this.error(`Problem fetching versions, ${err.status}: ${err.description}`)
        }
      }
    }, result)
  }
}
