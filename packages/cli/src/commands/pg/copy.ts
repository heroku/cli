import color from '@heroku-cli/color'
import {APIClient, Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import host from '../../lib/pg/host'
import backupsFactory from '../../lib/pg/backups'
import {getAttachment} from '../../lib/pg/fetcher'
import {parsePostgresConnectionString} from '../../lib/pg/util'
import confirmCommand from '../../lib/confirmCommand'

const cli = require('heroku-cli-util')

type AttachmentInfo = {
  name: string,
  url: string,
  confirm: string,
  attachment?: Heroku.AddOnAttachment,
}

const getAttachmentInfo = async function (heroku: APIClient, db: string, app: string) {
  if (db.match(/^postgres:\/\//)) {
    const conn = parsePostgresConnectionString(db)
    const host = `${conn.host}:${conn.port}`
    return {
      name: conn.database ? `database ${conn.database} on ${host}` : `database on ${host}`,
      url: db,
      confirm: conn.database || conn.host,
    }
  }

  const attachment = await getAttachment(heroku, app, db)
  if (!attachment)
    throw new Error(`${db} not found on ${color.magenta(app)}`)

  const {body: addon} = await heroku.get<Heroku.AddOnAttachment>(`/addons/${attachment.addon.name}`)
  const {body: config} = await heroku.get<Heroku.ConfigVars>(`/apps/${attachment.app.name}/config-vars`)
  const formattedConfig = Object.fromEntries(Object.entries(config).map(([k, v]) => [k.toUpperCase(), v]))

  return {
    name: attachment.name.replace(/^HEROKU_POSTGRESQL_/, '')
      .replace(/_URL$/, ''),
    url: formattedConfig[attachment.name.toUpperCase() + '_URL'],
    attachment: {
      ...attachment,
      addon,
    },
    confirm: app,
  }
}

export default class Copy extends Command {
    static topic = 'pg';
    static description = 'copy all data from source db to target';
    static help = 'at least one of the databases must be a Heroku PostgreSQL DB';
    static flags = {
      'wait-interval': flags.string(),
      verbose: flags.boolean(),
      confirm: flags.string(),
      app: flags.app({required: true}),
      remote: flags.remote(),
    };

    static args = {
      source: Args.string({required: true}),
      target: Args.string({required: true}),
    };

    public async run(): Promise<void> {
      const {flags, args} = await this.parse(Copy)
      const {'wait-interval': waitInterval, verbose, confirm, app} = flags
      const pgbackups = backupsFactory(app, this.heroku)
      const interval = Math.max(3, Number.parseInt(waitInterval || '0')) || 3

      const [source, target] = await Promise.all([getAttachmentInfo(this.heroku, args.source, app), getAttachmentInfo(this.heroku, args.target, app)])
      if (source.url === target.url)
        throw new Error('Cannot copy database onto itself')
      await confirmCommand(target.confirm, confirm, `WARNING: Destructive action\nThis command will remove all data from ${color.yellow(target.name)}\nData from ${color.yellow(source.name)} will then be transferred to ${color.yellow(target.name)}`)
      let copy
      let attachment
      await ux.action(`Starting copy of ${color.yellow(source.name)} to ${color.yellow(target.name)}`, (async function () {
        attachment = target.attachment || source.attachment
        if (!attachment)
          throw new Error('Heroku PostgreSQL database must be source or target')
        copy = await this.heroku.post(`/client/v11/databases/${attachment.addon.id}/transfers`, {
          body: {
            from_name: source.name, from_url: source.url, to_name: target.name, to_url: target.url,
          }, host: host(attachment.addon),
        })
      })())


      if (source.attachment) {
        const credentials = await this.heroku.get(`/postgres/v0/databases/${source.attachment.addon.name}/credentials`, {host: host(source.attachment.addon)})
        if (credentials.length > 1) {
          cli.action.warn('pg:copy will only copy your default credential and the data it has access to. Any additional credentials and data that only they can access will not be copied.')
        }
      }

      await pgbackups.wait('Copying', copy.uuid, interval, verbose, attachment.addon.app.name)
    }
}
