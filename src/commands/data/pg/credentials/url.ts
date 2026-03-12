import {color, hux, utils} from '@heroku/heroku-cli-util'
import {flags as Flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'
import {URL} from 'url'

import type {
  AdvancedCredentialInfo,
  CredentialInfo,
  CredentialsInfo,
  NonAdvancedCredentialInfo,
} from '../../../../lib/data/types.js'

import BaseCommand from '../../../../lib/data/baseCommand.js'
import {isAdvancedCredentialInfo} from '../../../../lib/data/types.js'

const heredoc = tsheredoc.default

export default class Url extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }

  static description = 'show information on a Postgres database credential'

  static examples = [
    '<%= config.bin %> <%= command.id %> DATABASE --app myapp',
  ]

  static flags = {
    app: Flags.app({required: true}),
    name: Flags.string({
      char: 'n',
      description: '[default: owner or default credential, if not specified] credential to show',
    }),
    remote: Flags.remote(),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Url)
    const {app, name} = flags
    const {database} = args

    const addonResolver = new utils.AddonResolver(this.heroku)
    const addon = await addonResolver.resolve(database, app, utils.pg.addonService())
    const isAdvancedTier = utils.pg.isAdvancedDatabase(addon)
    const isEssentialTier = utils.pg.isEssentialDatabase(addon) || utils.pg.isLegacyEssentialDatabase(addon)

    if (isEssentialTier && name && name !== 'default') {
      ux.error('Essential-tier databases don\'t support named credentials.', {exit: 1})
    }

    let credName: string
    let credInfo: CredentialInfo

    if (isAdvancedTier) {
      const {body: {items: availableCreds}} = await this.dataApi.get<CredentialsInfo>(
        `/data/postgres/v1/${addon.id}/credentials`,
      )
      const ownerCred = availableCreds.find(cred => cred.type === 'owner')
      credName = name || ownerCred?.name
      if (!credName) {
        ux.error(`There are no active credentials on the database ${color.datastore(addon.name)}.`, {exit: 1})
      }

      ({body: credInfo} = await this.dataApi.get<AdvancedCredentialInfo>(
        `/data/postgres/v1/${addon.id}/credentials/${encodeURIComponent(credName)}`,
      ))
    } else {
      credName = name ?? 'default';
      ({body: credInfo} = await this.dataApi.get<NonAdvancedCredentialInfo>(
        `/postgres/v0/databases/${addon.id}/credentials/${encodeURIComponent(credName)}`,
      ))
    }

    const activeCreds = isAdvancedCredentialInfo(credInfo)
      ? credInfo.roles.find(c => c.state === 'active')
      : credInfo.credentials.find(c => c.state === 'active')
    if (!activeCreds) {
      ux.error(`The credential ${color.name(credName)} isn't active on the database ${color.datastore(addon.name)}.`, {exit: 1})
    }

    const creds = {
      ...addon,
      database: credInfo.database,
      host: credInfo.host,
      password: activeCreds.password,
      port: credInfo.port,
      user: activeCreds.user,
    }

    const connUrl = new URL(`postgres://${creds.host}/${creds.database}`)
    connUrl.port = creds.port.toString()
    if (creds.user && creds.password) {
      connUrl.username = creds.user
      connUrl.password = creds.password
    }

    hux.styledHeader(`Connection information for ${color.name(credName)} credential:`)

    ux.stdout(heredoc`
      Connection info string:
      ${color.info(`"dbname=${creds.database} host=${creds.host} port=${creds.port} user=${creds.user} password=${creds.password} sslmode=require"`)}

      Connection URL:
      ${color.info(connUrl.toString())}
    `)
  }
}
