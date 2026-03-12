import {color, utils} from '@heroku/heroku-cli-util'
import {flags as Flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import BaseCommand from '../../../../lib/data/baseCommand.js'

const heredoc = tsheredoc.default

export default class DataPgCredentialsCreate extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }

  static description = 'create credentials for a Postgres database'

  static examples = [
    '<%= config.bin %> <%= command.id %> DATABASE --name my-credential --app example-app',
  ]

  static flags = {
    app: Flags.app({required: true}),
    name: Flags.string({char: 'n', description: 'name for the credential', required: true}),
    remote: Flags.remote(),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgCredentialsCreate)
    const {app, name} = flags
    const {database} = args
    const addonResolver = new utils.AddonResolver(this.heroku)
    const addon = await addonResolver.resolve(database, app, utils.pg.addonService())
    const isEssentialTier = utils.pg.isEssentialDatabase(addon) || utils.pg.isLegacyEssentialDatabase(addon)

    if (isEssentialTier) {
      ux.error('You can\'t create custom credentials on Essential-tier databases.')
    }

    const data = {name}
    let attachCmd = ''
    try {
      ux.action.start(`Creating credential ${color.cyan.bold(name)}`)
      if (utils.pg.isAdvancedDatabase(addon)) {
        await this.dataApi.post(`/data/postgres/v1/${addon.id}/credentials`, {body: data})
        attachCmd = `heroku data:pg:attachments:create ${addon.name} --credential ${name} -a ${app}`
      } else {
        await this.dataApi.post(`/postgres/v0/databases/${addon.id}/credentials`, {body: data})
        attachCmd = `heroku addons:attach ${addon.name} --credential ${name} -a ${app}`
      }

      ux.action.stop()
    } catch (error) {
      ux.action.stop(color.red('!'))
      throw error
    }

    const psqlCmd = `heroku pg:psql ${addon.name} -a ${app}`
    ux.stdout(heredoc`
      Attach the credential to the apps you want to use it in with ${color.code(attachCmd)}.
      Define the new grants for the credential in Postgres with ${color.code(psqlCmd)}.
    `)
  }
}
