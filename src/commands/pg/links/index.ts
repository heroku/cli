import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {type LinkedDatabase, linkExtensions} from '@heroku/sdk/extensions/data'
import {Args} from '@oclif/core'

import {createSDK} from '../../../lib/sdk.js'
import {nls} from '../../../nls.js'

export default class Index extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }
  static description = 'lists all databases and information on link'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static topic = 'pg'

  public async run(): Promise<LinkedDatabase[]> {
    const {args, flags} = await this.parse(Index)
    const {app} = flags
    const {data} = createSDK(this.heroku, {extensions: [linkExtensions]})

    const dbs = await data.link.listByApp(app, args.database)
    if (dbs.length === 0)
      throw new Error(`No databases on ${color.app(app)}`)

    let once: boolean = false
    for (const {addon, links} of dbs) {
      if (once)
        this.log()
      else
        once = true
      hux.styledHeader(color.datastore(addon.name))
      // This doesn't exist according to Shogun's link serializer. May it be that the original idea was to use Promise.allSettled
      // and capture here and show only the error message if an error was returned for some database? Currently a CLI error is
      // thrown instead, because Promise.all will reject if any of the promises reject and there's no catch block for that.
      // if (db.links?.message)
      //   return this.log(db.links.message)
      if (links.length === 0) {
        this.log('No data sources are linked into this database')
        continue
      }

      for (const link of links) {
        this.log(` * ${color.name(link.name)}`)
        const remoteAttachmentName = link.remote?.attachment_name || ''
        const remoteName = link.remote?.name || ''
        const remoteLinkText = `${color.name(remoteAttachmentName)} (${color.datastore(remoteName)})`
        hux.styledObject({
          created_at: link.created_at,
          remote: remoteLinkText,
        })
      }
    }

    return dbs
  }
}
