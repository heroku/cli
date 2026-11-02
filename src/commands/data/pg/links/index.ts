import {flags as Flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {styledHeader, styledObject} from '@heroku/heroku-cli-util/hux'
import {
  isAdvancedDatabase, isEssentialDatabase, isLegacyEssentialDatabase,
} from '@heroku/heroku-cli-util/utils'
import {Args, ux} from '@oclif/core'

import type {Link} from '../../../../lib/data/types.js'

import BaseCommand from '../../../../lib/data/base-command.js'
import {getAdvancedAttachment, getAllAdvancedDatabases} from '../../../../lib/pg/util.js'

export default class DataPgLinks extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database attachment name or related config var on an app',
    }),
  }
  static description = 'list Data Links on a Postgres Advanced database'
  static examples = [
    '<%= config.bin %> <%= command.id %> database_name --app example-app',
  ]
  static flags = {
    app: Flags.app({required: true}),
    remote: Flags.remote(),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgLinks)
    const {app} = flags
    const {database} = args

    let databases
    if (database) {
      const {addon} = await getAdvancedAttachment(this.heroku, app, database)

      if (isEssentialDatabase(addon as any) || isLegacyEssentialDatabase(addon as any)) {
        ux.error("You can only use this command to view Data Links on Advanced-tier databases.")
      }

      if (!isAdvancedDatabase(addon as any)) {
        ux.error('You can only use this command to view Data Links on Advanced-tier databases.\n'
          + `Use ${color.code(`heroku pg:links ${addon.name} -a ${app}`)} instead.`)
      }

      databases = [addon]
    } else {
      databases = await getAllAdvancedDatabases(this.heroku, app)
      if (databases.length === 0) {
        ux.error('No Heroku Postgres Advanced-tier databases found on the app.')
      }
    }

    let once = false
    for (const db of databases) {
      const {body: {items: links}} = await this.dataApi.get<{items: Link[]}>(`/data/postgres/v1/${db.id}/links`)

      if (once) {
        ux.stdout('')
      } else {
        once = true
      }

      styledHeader(color.datastore(db.name))

      if (links.length === 0) {
        ux.stdout("This database isn't linked to another data source.")
        continue
      }

      for (const link of links) {
        ux.stdout(` * ${color.name(link.name)}`)
        const remoteAttachmentName = link.remote?.attachment_name || ''
        const remoteName = link.remote?.name || ''
        const remoteLinkText = `${color.name(remoteAttachmentName)} (${color.datastore(remoteName)})`
        styledObject({
          created_at: link.created_at,
          remote: remoteLinkText,
        })
      }
    }
  }
}
