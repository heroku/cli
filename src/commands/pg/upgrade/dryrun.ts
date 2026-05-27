import {Command, flags} from '@heroku-cli/command'
import {color, utils} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import ConfirmCommand from '../../../lib/confirm-command.js'
import {getDatabaseInfo} from '../../../lib/pg/sdk-adapter.js'
import {formatResponseWithCommands} from '../../../lib/pg/util.js'
import {nls} from '../../../nls.js'

const heredoc = tsheredoc.default

export default class Upgrade extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }
  static description = heredoc(`
    simulates a Postgres version upgrade on a Standard-tier and higher leader database by creating and upgrading a follower database. Heroku sends the results of the test upgrade via email.
  `)
  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string({char: 'c'}),
    version: flags.string({char: 'v', description: 'Postgres version to upgrade to'}),
  }
  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Upgrade)
    const {app, confirm, version} = flags
    const {database} = args

    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const {addon: db} = await dbResolver.getAttachment(app, database)
    if (utils.pg.isLegacyEssentialDatabase(db))
      ux.error(`You can only use ${color.code('pg:upgrade:*')} commands on Essential-* and higher plans.`)

    if (utils.pg.isEssentialDatabase(db))
      ux.error(`You can't use ${color.code('pg:upgrade:dryrun')} on Essential-tier databases. You can only use this command on Standard-tier and higher leader databases.`)

    const versionPhrase = version ? heredoc(`Postgres version ${version}`) : heredoc('the latest supported Postgres version')
    const {data} = new HerokuSDK()
    const replica = await getDatabaseInfo(data, db.id)
    if (replica.following)
      ux.error(`You can't use ${color.code('pg:upgrade:dryrun')} on follower databases. You can only use this command on Standard-tier and higher leader databases.`)

    await new ConfirmCommand().confirm(app, confirm, heredoc(`
        This command starts a test upgrade for ${color.datastore(db.name)} to ${versionPhrase}.
    `))

    try {
      ux.action.start(`Starting a test upgrade on ${color.datastore(db.name)}`)
      const dryRunUpgrade = data.database.dryRunUpgrade as (name: string, body: {version?: string}) => Promise<unknown>
      const response = await dryRunUpgrade(db.id, {version}) as {message: string}
      ux.action.stop('done\n' + formatResponseWithCommands(response.message))
    } catch (error: any) {
      if (error.id && error.message) {
        ux.error(formatResponseWithCommands(error.message) + `\n\nError ID: ${error.id}`)
      } else {
        throw error
      }
    }
  }
}
