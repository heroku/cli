import {color, hux, utils} from '@heroku/heroku-cli-util'
import {flags as Flags} from '@heroku-cli/command'
import {AddOnAttachment} from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

import type {CredentialInfo, CredentialsInfo} from '../../../../lib/data/types.js'

import BaseCommand from '../../../../lib/data/baseCommand.js'

export default class DataPgCredentialsDestroy extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }

  static description = 'destroy credentials on a Postgres database'

  static examples = [
    '<%= config.bin %> <%= command.id %> DATABASE --name my-credential --app example-app',
  ]

  static flags = {
    app: Flags.app({required: true}),
    confirm: Flags.string({char: 'c', description: 'pass in the app name to skip confirmation prompts'}),
    name: Flags.string({char: 'n', description: 'name of credential', required: true}),
    remote: Flags.remote(),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgCredentialsDestroy)
    const {app, confirm, name} = flags
    const {database} = args

    const addonResolver = new utils.AddonResolver(this.heroku)
    const addon = await addonResolver.resolve(database, app, utils.pg.addonService())
    const isEssentialTier = utils.pg.isEssentialDatabase(addon) || utils.pg.isLegacyEssentialDatabase(addon)
    const isAdvancedTier = utils.pg.isAdvancedDatabase(addon)
    let credAttachments: Required<AddOnAttachment>[] = []

    if (isAdvancedTier) {
      const [{body: {items: availableCreds}}, {body: attachments}] = await Promise.all([
        this.dataApi.get<CredentialsInfo>(`/data/postgres/v1/${addon.id}/credentials`),
        this.heroku.get<Required<AddOnAttachment>[]>(`/addons/${addon.id}/addon-attachments`),
      ])
      const ownerCred = availableCreds.find((cred: CredentialInfo) => cred.type === 'owner')
      if (ownerCred?.name === name) {
        ux.error('You can\'t destroy the owner credential.')
      }

      credAttachments = attachments.filter(a => a.namespace === `role:${name}`)
    } else if (isEssentialTier || name === 'default') {
      ux.error('You can\'t destroy the default credential.')
    } else {
      const {body: attachments} = await this.heroku.get<Required<AddOnAttachment>[]>(
        `/addons/${addon.id}/addon-attachments`,
      )
      credAttachments = attachments.filter(a => a.namespace === `credential:${name}`)
    }

    const credAttachmentApps = [...new Set(credAttachments.map(a => a.app.name!))]
    if (credAttachmentApps.length > 0) {
      ux.error(
        `You must detach the credential ${color.name(name)} from the `
        + `app${credAttachmentApps.length > 1 ? 's' : ''} `
        + `${credAttachmentApps.map(appName => color.app(appName || '')).join(', ')} before destroying it.`,
      )
    }

    await hux.confirmCommand({comparison: app, confirmation: confirm})

    try {
      ux.action.start(`Destroying credential ${color.name(name)}`)
      if (isAdvancedTier) {
        await this.dataApi.delete(`/data/postgres/v1/${addon.id}/credentials/${encodeURIComponent(name)}`)
      } else {
        await this.dataApi.delete(`/postgres/v0/databases/${addon.name}/credentials/${encodeURIComponent(name)}`)
      }

      ux.action.stop()
      ux.stdout(`We destroyed the credential ${color.name(name)} in ${color.datastore(addon.name)}.`)
      ux.stdout(
        `Database objects owned by ${color.name(name)} will be assigned to the `
        + `${isAdvancedTier ? 'owner' : 'default'} credential.`,
      )
    } catch (error) {
      ux.action.stop(color.red('!'))
      throw error
    }
  }
}
