import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {getAddon, all} from '../../../lib/pg/fetcher'
import pgHost from '../../../lib/pg/host'
import type {Link} from '../../../lib/pg/types'
import {nls} from '../../../nls'

export default class Index extends Command {
  static topic = 'pg';
  static description = 'lists all databases and information on link';
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  };

  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  };

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Index)
    const {app} = flags
    const {database} = args
    let dbs
    if (database)
      dbs = await Promise.all([getAddon(this.heroku, app, database)])
    else
      dbs = await all(this.heroku, app)
    if (dbs.length === 0)
      throw new Error(`No databases on ${color.app(app)}`)
    dbs = await Promise.all(dbs.map(async db => {
      const {body: links} = await this.heroku.get<Link[]>(`/client/v11/databases/${db.id}/links`, {hostname: pgHost()})
      db.links = links
      return db
    }))
    let once: boolean
    dbs.forEach(db => {
      if (once)
        ux.log()
      else
        once = true
      ux.styledHeader(color.yellow(db.name))
      if (db.links.message)
        return ux.log(db.links.message)
      if (db.links.length === 0)
        return ux.log('No data sources are linked into this database')
      db.links.forEach((link: Link) => {
        ux.log(` * ${color.cyan(link.name)}`)
        const remoteAttachmentName = link.remote?.attachment_name || ''
        const remoteName = link.remote?.name || ''
        const remoteLinkText = `${color.green(remoteAttachmentName)} (${color.yellow(remoteName)})`
        ux.styledObject({
          created_at: link.created_at,
          remote: remoteLinkText,
        })
      })
    })
  }
}
