import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {postgresDatabaseExtensions} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'

import {createSDK} from '../../../lib/sdk.js'
import {nls} from '../../../nls.js'

export default class Destroy extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }
  static description = 'destroy credential within database'
  static example = `${color.command('heroku pg:credentials:destroy postgresql-transparent-56874 --name cred-name -a woodstock-production')}`
  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string({char: 'c', description: 'set to app name to bypass confirm prompt'}),
    name: flags.string({char: 'n', description: 'unique identifier for the credential', required: true}),
    remote: flags.remote(),
  }
  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Destroy)
    const {database} = args
    const {app, confirm, name} = flags
    const {data} = createSDK(this.heroku, {extensions: [postgresDatabaseExtensions]})

    await hux.confirmCommand({comparison: app, confirmation: confirm})

    ux.action.start(`Destroying credential ${color.name(name)}`)
    const {addon: db} = await data.postgresDatabase.deleteCredential(app, name, {addonIdentity: database})
    ux.action.stop()
    ux.stdout(`The credential has been destroyed within ${db.name}.`)
    ux.stdout(`Database objects owned by ${name} will be assigned to the default credential.`)
  }
}
