import {Command, flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import * as pg from '@heroku/heroku-cli-util/utils/pg'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {essentialPlan} from '../../../lib/pg/util.js'
import {nls} from '../../../nls.js'

const heredoc = tsheredoc.default

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
    const dbResolver = new pg.DatabaseResolver(this.heroku)
    const {addon: db} = await dbResolver.getAttachment(app, args.database)
    if (essentialPlan(db)) {
      throw new Error("You can't create a custom credential on Essential-tier databases.")
    }

    const data = {name}
    ux.action.start(`Creating credential ${color.cyan.bold(name)}`)

    await this.heroku.post(`/postgres/v0/databases/${db.name}/credentials`, {body: data, hostname: pg.getHost()})
    ux.action.stop()

    const attachCmd = `heroku addons:attach ${db.name} --credential ${name} -a ${app}`
    const psqlCmd = `heroku pg:psql ${db.name} -a ${app}`
    ux.stdout(heredoc(`

      Please attach the credential to the apps you want to use it in by running ${color.cyan.bold(attachCmd)}.
      Please define the new grants for the credential within Postgres: ${color.cyan.bold(psqlCmd)}.`))
  }
}
