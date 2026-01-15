import {color, utils} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

import ConfirmCommand from '../../../lib/confirmCommand.js'
import {essentialPlan} from '../../../lib/pg/util.js'
import {nls} from '../../../nls.js'

export default class Destroy extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }

  static description = 'destroy credential within database'
  static example = '$ heroku pg:credentials:destroy postgresql-transparent-56874 --name cred-name -a woodstock-production'

  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string({char: 'c', description: 'set to app name to bypass confirm prompt'}),
    name: flags.string({char: 'n', required: true, description: 'unique identifier for the credential'}),
    remote: flags.remote(),
  }

  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Destroy)
    const {database} = args
    const {app, confirm, name} = flags
    if (name === 'default') {
      throw new Error('Default credential cannot be destroyed.')
    }

    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const {addon: db} = await dbResolver.getAttachment(app, database)
    if (essentialPlan(db)) {
      throw new Error("You can't destroy the default credential on Essential-tier databases.")
    }

    const {body: attachments} = await this.heroku.get<Heroku.AddOnAttachment[]>(`/addons/${db.name}/addon-attachments`)
    const credAttachments = attachments.filter(a => a.namespace === `credential:${name}`)
    const credAttachmentApps = Array.from(new Set(credAttachments.map(a => a.app?.name)))
    if (credAttachmentApps.length > 0)
      throw new Error(`Credential ${name} must be detached from the app${credAttachmentApps.length > 1 ? 's' : ''} ${credAttachmentApps.map(appName => color.app(appName || ''))
        .join(', ')} before destroying.`)

    await new ConfirmCommand().confirm(app, confirm)
    ux.action.start(`Destroying credential ${color.cyan.bold(name)}`)
    await this.heroku.delete(`/postgres/v0/databases/${db.name}/credentials/${encodeURIComponent(name)}`, {hostname: utils.pg.host()})
    ux.action.stop()
    ux.stdout(`The credential has been destroyed within ${db.name}.`)
    ux.stdout(`Database objects owned by ${name} will be assigned to the default credential.`)
  }
}
