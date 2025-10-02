import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import heredoc from 'tsheredoc'
import {essentialPlan} from '../../../lib/pg/util'
import {utils} from '@heroku/heroku-cli-util'
import {nls} from '../../../nls'

export default class Attach extends Command {
    static topic = 'pg'
    static description = 'add an attachment to a database using connection pooling'
    static examples = [heredoc`
      $ heroku pg:connection-pooling:attach postgresql-something-12345
    `]

    static flags = {
      as: flags.string({description: 'name for add-on attachment'}),
      app: flags.app({required: true}),
      remote: flags.remote(),
    }

    static args = {
      database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
    }

    public async run(): Promise<void> {
      const {flags, args} = await this.parse(Attach)
      const {app} = flags
      const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
      const {addon: db} = await dbResolver.getAttachment(app, args.database)

      if (essentialPlan(db))
        ux.error('You can’t perform this operation on Essential-tier databases.')

      ux.action.start(`Enabling Connection Pooling on ${color.yellow(db.name)} to ${color.magenta(app)}`)
      const {body: attachment} = await this.heroku.post<Required<Heroku.AddOnAttachment>>(`/client/v11/databases/${encodeURIComponent(db.name)}/connection-pooling`, {
        body: {name: flags.as, credential: 'default', app: app}, hostname: utils.pg.host(),
      })
      ux.action.stop()

      ux.action.start(`Setting ${color.cyan(attachment.name)} config vars and restarting ${color.magenta(app)}`)
      const {body: releases} = await this.heroku.get<Required<Heroku.Release>[]>(
        `/apps/${app}/releases`,
        {partial: true, headers: {Range: 'version ..; max=1, order=desc'}},
      )
      ux.action.stop(`done, v${releases[0].version}`)
    }
}
