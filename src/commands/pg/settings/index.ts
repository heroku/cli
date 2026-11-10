import {Command, flags} from '@heroku-cli/command'
import {hux} from '@heroku/heroku-cli-util'
import {type DatabaseSettingKey, databaseSettingsExtensions} from '@heroku/sdk/extensions/data'
import {Args} from '@oclif/core'

import {withEssentialTierMessage} from '../../../lib/pg/setter.js'
import {createSDK} from '../../../lib/sdk.js'
import {nls} from '../../../nls.js'

export default class Index extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }
  static description = 'show your current database settings'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Index)
    const {app} = flags
    const {database} = args
    const {data} = createSDK(this.heroku, {extensions: [databaseSettingsExtensions]})
    const {addon, settings} = await withEssentialTierMessage(this, () => data.databaseSettings.getAll(app, database))

    this.log(hux.styledHeader(addon.name))
    const remapped: Record<string, unknown> = {}
    for (const k of Object.keys(settings).sort()) {
      remapped[k.replaceAll('_', '-')] = settings[k as DatabaseSettingKey]?.value
    }

    this.log(hux.styledObject(remapped))
  }
}
