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
      this.log(hux.styledHeader(color.datastore(addon.name)))
      if (links.length === 0) {
        this.log('No data sources are linked into this database')
        continue
      }

      for (const link of links) {
        this.log(` * ${color.name(link.name)}`)
        const remoteAttachmentName = link.remote?.attachment_name || ''
        const remoteName = link.remote?.name || ''
        const remoteLinkText = `${color.name(remoteAttachmentName)} (${color.datastore(remoteName)})`
        this.log(hux.styledObject({
          created_at: link.created_at,
          remote: remoteLinkText,
        }))
      }
    }

    return dbs
  }
}
