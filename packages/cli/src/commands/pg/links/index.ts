import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {hux, utils} from '@heroku/heroku-cli-util'
import type {Link} from '../../../lib/pg/types.js'
import {nls} from '../../../nls.js'

export default class Index extends Command {
  static topic = 'pg'
  static description = 'lists all databases and information on link'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Index)
    const {app} = flags
    const {database} = args
    type all = typeof utils.pg.DatabaseResolver.prototype.getAllLegacyDatabases

    let dbs: Array<(Awaited<ReturnType<all>>)[number] & {links?: Link[]}>
    if (database) {
      const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
      const {addon} = await dbResolver.getAttachment(app, database)
      dbs = [addon]
    } else {
      const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
      dbs = await dbResolver.getAllLegacyDatabases(app)
    }

    if (dbs.length === 0)
      throw new Error(`No databases on ${color.app(app)}`)
    dbs = await Promise.all(dbs.map(async db => {
      const {body: links} = await this.heroku.get<Link[]>(`/client/v11/databases/${db.id}/links`, {hostname: utils.pg.host()})
      db.links = links
      return db
    }))
    let once: boolean
    dbs.forEach(db => {
      if (once)
        this.log()
      else
        once = true
      hux.styledHeader(color.yellow(db.name))
      // This doesn't exist according to Shogun's link serializer. May it be that the original idea was to use Promise.allSettled
      // and capture here and show only the error message if an error was returned for some database? Currently a CLI error is
      // thrown instead, because Promise.all will reject if any of the promises reject and there's no catch block for that.
      // if (db.links?.message)
      //   return this.log(db.links.message)
      if (db.links?.length === 0)
        return this.log('No data sources are linked into this database')
      db.links?.forEach((link: Link) => {
        this.log(` * ${color.cyan(link.name)}`)
        const remoteAttachmentName = link.remote?.attachment_name || ''
        const remoteName = link.remote?.name || ''
        const remoteLinkText = `${color.green(remoteAttachmentName)} (${color.yellow(remoteName)})`
        hux.styledObject({
          created_at: link.created_at,
          remote: remoteLinkText,
        })
      })
    })
  }
}
