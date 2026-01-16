import {color, utils} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {essentialPlan} from '../../../lib/pg/util.js'
import {nls} from '../../../nls.js'

const heredoc = tsheredoc.default

export default class Attach extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }

  static description = 'add an attachment to a database using connection pooling'

  static examples = [heredoc`
      $ heroku pg:connection-pooling:attach postgresql-something-12345
    `]

  static flags = {
    app: flags.app({required: true}),
    as: flags.string({description: 'name for add-on attachment'}),
    remote: flags.remote(),
  }

  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Attach)
    const {app} = flags
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const {addon: db} = await dbResolver.getAttachment(app, args.database)

    if (essentialPlan(db))
      ux.error('You can\'t perform this operation on Essential-tier databases.')

    ux.action.start(`Enabling Connection Pooling on ${color.yellow(db.name)} to ${color.app(app)}`)
    const {body: attachment} = await this.heroku.post<Required<Heroku.AddOnAttachment>>(`/client/v11/databases/${encodeURIComponent(db.name)}/connection-pooling`, {
      body: {app, credential: 'default', name: flags.as}, hostname: utils.pg.host(),
    })
    ux.action.stop()

    ux.action.start(`Setting ${color.cyan(attachment.name)} config vars and restarting ${color.app(app)}`)
    const {body: releases} = await this.heroku.get<Required<Heroku.Release>[]>(
      `/apps/${app}/releases`,
      {headers: {Range: 'version ..; max=1, order=desc'}, partial: true},
    )
    ux.action.stop(`done, v${releases[0].version}`)
  }
}
