import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {APIClient} from '@heroku-cli/command/lib/api-client'
import type {AddOnAttachment} from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'
import confirm from '../../../lib/confirm'
import {getAttachment} from '../../../lib/pg/fetcher'
import host from '../../../lib/pg/host'
import {legacyEssentialPlan} from '../../../lib/pg/util'

export default class Rotate extends Command {
  static topic = 'pg'
  static description = 'rotate the database credentials'
  static flags = {
    name: flags.string({
      char: 'n',
      description: 'which credential to rotate (default credentials if not specified and --all is not used)',
    }),
    all: flags.boolean({description: 'rotate all credentials', exclusive: ['name']}),
    confirm: flags.string({char: 'c'}),
    force: flags.boolean({description: 'forces rotating the targeted credentials'}),
    app: flags.app({required: true}),
  }

  static args = {
    database: Args.string(),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Rotate)
    const {app, all, confirm, name, force} = flags
    const {addon: db} = await getAttachment(this.heroku, app, args.database)
    const warnings: string[] = []
    const cred = name || 'default'
    if (all && name !== undefined) {
      throw new Error('cannot pass both --all and --name')
    }

    if (legacyEssentialPlan(db) && cred !== 'default') {
      throw new Error('Legacy Essential-tier databases do not support named credentials.')
    }

    if (all && force) {
      warnings.push('This forces rotation on all credentials including the default credential.')
    }

    let {body: attachments} = await this.heroku.get<Required<AddOnAttachment>[]>(`/addons/${db.name}/addon-attachments`)
    if (name) {
      attachments = attachments.filter(a => a.namespace === `credential:${cred}`)
    }

    if (!all) {
      warnings.push(`The password for the ${cred} credential will rotate.`)
    }

    if (all || force || cred === 'default') {
      warnings.push('Connections will be reset and applications will be restarted.')
    } else {
      warnings.push('Connections older than 30 minutes will be reset, and a temporary rotation username will be used during the process.')
    }

    if (force) {
      warnings.push(`Any followers lagging in replication (see ${color.cyan.bold('heroku pg:info')}) will be inaccessible until caught up.`)
    }

    if (attachments.length > 0) {
      const uniqueAttachments = [...new Set(attachments.map(attachment => color.app(attachment.app.name || '')))]
        .sort()
        .join(', ')

      warnings.push(`This command will affect the app${(attachments.length > 1) ? 's' : ''} ${uniqueAttachments}.`)
    }

    await confirm(app, confirm, `Destructive Action\n${warnings.join('\n')}`)
    const options: APIClient.Options = {
      hostname: host(),
      body: {forced: force ?? undefined},
      headers: {
        Authorization: `Basic ${Buffer.from(`:${this.heroku.auth}`).toString('base64')}`,
      },
    }
    if (all) {
      ux.action.start(`Rotating all credentials on ${color.yellow(db.name)}`)
      await this.heroku.post(`/postgres/v0/databases/${db.name}/credentials_rotation`, options)
    } else {
      ux.action.start(`Rotating ${cred} on ${color.yellow(db.name)}`)
      await this.heroku.post(`/postgres/v0/databases/${db.name}/credentials/${encodeURIComponent(cred)}/credentials_rotation`, options)
    }

    ux.action.stop()
  }
}
