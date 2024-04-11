import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {essentialPlan} from '../../../lib/pg/util'
import {getAddon} from '../../../lib/pg/fetcher'
import pgHost from '../../../lib/pg/host'
import confirmCommand from '../../../lib/confirmCommand'

export default class Destroy extends Command {
  static topic = 'pg';
  static description = 'destroy credential within database';
  static example = '$ heroku pg:credentials:destroy postgresql-transparent-56874 --name cred-name -a woodstock-production';
  static flags = {
    name: flags.string({char: 'n', required: true, description: 'unique identifier for the credential'}),
    confirm: flags.string({char: 'c'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  };

  static args = {
    database: Args.string(),
  };

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Destroy)
    const {database} = args
    const {app, name, confirm} = flags
    if (name === 'default') {
      throw new Error('Default credential cannot be destroyed.')
    }

    const db = await getAddon(this.heroku, app, database)
    if (essentialPlan(db)) {
      throw new Error("You can't destroy the default credential on Essential-tier databases.")
    }

    const {body: attachments} = await this.heroku.get<Heroku.AddOnAttachment[]>(`/addons/${db.name}/addon-attachments`)
    const credAttachments = attachments.filter(a => a.namespace === `credential:${name}`)
    const credAttachmentApps = Array.from(new Set(credAttachments.map(a => a.app?.name)))
    if (credAttachmentApps.length > 0)
      throw new Error(`Credential ${name} must be detached from the app${credAttachmentApps.length > 1 ? 's' : ''} ${credAttachmentApps.map(appName => color.app(appName || ''))
        .join(', ')} before destroying.`)

    await confirmCommand(app, confirm)
    ux.action.start(`Destroying credential ${color.cyan.bold(name)}`)
    await this.heroku.delete(`/postgres/v0/databases/${db.name}/credentials/${encodeURIComponent(name)}`, {hostname: pgHost()})
    ux.action.stop()
    ux.log(`The credential has been destroyed within ${db.name}.`)
    ux.log(`Database objects owned by ${name} will be assigned to the default credential.`)
  }
}
