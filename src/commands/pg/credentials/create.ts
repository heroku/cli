import {Command, flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {postgresDatabaseExtensions} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {createSDK} from '../../../lib/sdk.js'
import {nls} from '../../../nls.js'

const heredoc = tsheredoc

export default class Create extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }
  static description = 'create credential within database'
  static example = `${color.command('heroku pg:credentials:create postgresql-something-12345 --name new-cred-name')}`
  static flags = {
    app: flags.app({required: true}),
    name: flags.string({char: 'n', description: 'name of the new credential within the database', required: true}),
    remote: flags.remote(),
  }
  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Create)
    const {app, name} = flags
    const {data} = createSDK(this.heroku, {extensions: [postgresDatabaseExtensions]})

    ux.action.start(`Creating credential ${color.name(name)}`)
    const {addon: db} = await data.postgresDatabase.createCredentials(app, {name}, {addonIdentity: args.database})
    ux.action.stop()

    const attachCmd = `heroku addons:attach ${db.name} --credential ${name} -a ${app}`
    const psqlCmd = `heroku pg:psql ${db.name} -a ${app}`
    ux.stdout(heredoc(`

      Please attach the credential to the apps you want to use it in by running ${color.code(attachCmd)}.
      Please define the new grants for the credential within Postgres: ${color.code(psqlCmd)}.`))
  }
}
