import {color, utils} from '@heroku/heroku-cli-util'
import {APIClient, Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

import type {NonAdvancedCredentialInfo} from '../../lib/data/types.js'
import type {BackupTransfer} from '../../lib/pg/types.js'

import ConfirmCommand from '../../lib/confirmCommand.js'
import backupsFactory from '../../lib/pg/backups.js'

const getAttachmentInfo = async function (heroku: APIClient, db: string, app: string) {
  const dbResolver = new utils.pg.DatabaseResolver(heroku)

  if (db.match(/^postgres:\/\//)) {
    const conn = utils.pg.DatabaseResolver.parsePostgresConnectionString(db)
    const host = `${conn.host}:${conn.port}`
    return {
      confirm: conn.database || conn.host,
      name: conn.database ? `database ${conn.database} on ${host}` : `database on ${host}`,
      url: db,
    }
  }

  const attachment = await dbResolver.getAttachment(app, db)
  if (!attachment)
    throw new Error(`${db} not found on ${color.app(app)}`)

  const {body: addon} = await heroku.get<Heroku.AddOnAttachment>(`/addons/${attachment.addon.name}`)
  const {body: config} = await heroku.get<Heroku.ConfigVars>(`/apps/${attachment.app.name}/config-vars`)
  const formattedConfig = Object.fromEntries(Object.entries(config).map(([k, v]) => [k.toUpperCase(), v]))

  return {
    attachment: {
      ...attachment,
      addon,
    },
    confirm: app,
    name: attachment.name.replace(/^HEROKU_POSTGRESQL_/, '')
      .replace(/_URL$/, ''),
    url: formattedConfig[attachment.name.toUpperCase() + '_URL'],
  }
}

export default class Copy extends Command {
  static args = {
    source: Args.string({description: 'config var exposed to the owning app containing the source database URL', required: true}),
    target: Args.string({description: 'config var exposed to the owning app containing the target database URL', required: true}),
  }

  static description = 'copy all data from source db to target'
  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string(),
    remote: flags.remote(),
    verbose: flags.boolean(),
    'wait-interval': flags.string(),
  }

  static help = 'at least one of the databases must be a Heroku PostgreSQL DB'

  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Copy)
    const {app, confirm, verbose, 'wait-interval': waitInterval} = flags
    const pgbackups = backupsFactory(app, this.heroku)
    const interval = Math.max(3, Number.parseInt(waitInterval || '0', 10)) || 3

    const [source, target] = await Promise.all([getAttachmentInfo(this.heroku, args.source, app), getAttachmentInfo(this.heroku, args.target, app)])
    if (source.url === target.url)
      throw new Error('Cannot copy database onto itself')

    await new ConfirmCommand().confirm(target.confirm || args.target, confirm, `WARNING: Destructive action\nThis command will remove all data from ${color.yellow(target.name)}\nData from ${color.yellow(source.name)} will then be transferred to ${color.yellow(target.name)}`)
    ux.action.start(`Starting copy of ${color.yellow(source.name)} to ${color.yellow(target.name)}`)
    const attachment = target.attachment || source.attachment
    if (!attachment) {
      throw new Error('Heroku PostgreSQL database must be source or target')
    }

    const {body: copy} = await this.heroku.post<BackupTransfer>(`/client/v11/databases/${attachment.addon.id}/transfers`, {
      body: {
        from_name: source.name, from_url: source.url, to_name: target.name, to_url: target.url,
      },
      hostname: utils.pg.host(),
    })
    ux.action.stop()

    if (source.attachment) {
      const {body: credentials} = await this.heroku.get<NonAdvancedCredentialInfo[]>(
        `/postgres/v0/databases/${source.attachment.addon.name}/credentials`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`:${this.heroku.auth}`).toString('base64')}`,
          },
          hostname: utils.pg.host(),
        })
      if (credentials.length > 1) {
        ux.warn('pg:copy will only copy your default credential and the data it has access to. Any additional credentials and data that only they can access will not be copied.')
      }
    }

    await pgbackups.wait('Copying', copy.uuid, interval, verbose, attachment.addon.app?.name || app)
  }
}
