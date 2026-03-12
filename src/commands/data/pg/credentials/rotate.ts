import {color, hux, utils} from '@heroku/heroku-cli-util'
import {flags as Flags} from '@heroku-cli/command'
import {AddOn, AddOnAttachment} from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

import type {CredentialInfo, CredentialsInfo, NonAdvancedCredentialInfo} from '../../../../lib/data/types.js'

import BaseCommand from '../../../../lib/data/baseCommand.js'

export default class Rotate extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }

  static description = 'rotate credentials on a Postgres database'

  static flags = {
    all: Flags.boolean({
      description: 'rotate all credentials',
      exclusive: ['name'],
    }),
    app: Flags.app({required: true}),
    confirm: Flags.string({char: 'c', description: 'pass in the app name to skip confirmation prompts'}),
    force: Flags.boolean({description: 'force rotate the targeted credentials'}),
    name: Flags.string({
      char: 'n',
      description: '[default: owner or default credential, if not specified and --all isn\'t used] credential to rotate',
    }),
    remote: Flags.remote(),
  }

  public async confirmCommand(...args: Parameters<typeof hux.confirmCommand>): Promise<void> {
    return hux.confirmCommand(...args)
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Rotate)
    const {database} = args
    const {all, app, confirm, force, name} = flags

    const addonResolver = new utils.AddonResolver(this.heroku)
    const addon = await addonResolver.resolve(database, app, utils.pg.addonService())

    const isAdvancedTier = utils.pg.isAdvancedDatabase(addon)
    const isEssentialTier = utils.pg.isEssentialDatabase(addon)

    if (!isAdvancedTier && name && name !== 'default') {
      if (utils.pg.isLegacyEssentialDatabase(addon)) {
        ux.error('Legacy Essential-tier databases do not support named credentials.')
      }

      if (isEssentialTier) {
        ux.error('Essential-tier databases do not support named credentials.')
      }
    }

    const {attachments, availableCreds} = await this.getCredsAndAttachments(isAdvancedTier, addon)

    const {credToRotate, defaultCred, ownerCred} = this.getCredToRotate(isAdvancedTier, availableCreds, isEssentialTier, name)

    const warnings = isAdvancedTier
      ? this.renderWarnings({
        all, credToRotate, force, isAdvancedTier, isEssentialTier, ownerCred,
      })
      : this.renderWarnings({
        all, credToRotate, defaultCred, force, isAdvancedTier, isEssentialTier,
      })

    if (credToRotate && !all) {
      const {credAttachments, uniqueAppNames} = this.getCredAttachmentsAndUniqueAppNames(isAdvancedTier, isEssentialTier, credToRotate, attachments)
      if (credAttachments.length > 0) {
        warnings.push(`This command will affect the app${(credAttachments.length > 1) ? 's' : ''} ${uniqueAppNames}.`)
      }
    }

    await this.confirmCommand({comparison: app, confirmation: confirm, warningMessage: `Destructive Action\n${warnings.join('\n')}`})

    const body = {body: {forced: force ?? undefined}}

    if (all) {
      try {
        ux.action.start(`Rotating all credentials on ${color.datastore(addon.name)}`)
        isAdvancedTier
          ? await this.dataApi.post(`/data/postgres/v1/${addon.id}/rotate_credentials`, body)
          : await this.dataApi.post(`/postgres/v0/databases/${addon.id}/credentials_rotation`, body)
        ux.action.stop()
      } catch (error) {
        ux.action.stop('!')
        throw error
      }
    } else {
      const credName = isEssentialTier ? 'default' : credToRotate?.name

      if (!credName) {
        ux.error(`There are no credentials on the database ${color.datastore(addon.name)}.`, {exit: 1})
      }

      try {
        ux.action.start(`Rotating ${color.name(credName)} on ${color.datastore(addon.name)}`)
        isAdvancedTier
          ? await this.dataApi.post(`/data/postgres/v1/${addon.id}/credentials/${encodeURIComponent(credName)}/rotate`, body)
          : await this.dataApi.post(`/postgres/v0/databases/${addon.id}/credentials/${encodeURIComponent(credName)}/credentials_rotation`, body)
        ux.action.stop()
      } catch (error) {
        ux.action.stop('!')
        throw error
      }
    }
  }

  private getCredAttachmentsAndUniqueAppNames(isAdvancedTier: boolean, isEssentialTier: boolean, credToRotate: CredentialInfo, attachments: AddOnAttachment[]): {
    credAttachments: AddOnAttachment[],
    uniqueAppNames: string
  } {
    let uniqueAppNames = ''
    const namespace = isAdvancedTier
      ? (credToRotate.type === 'owner' ? null : `role:${credToRotate.name}`)
      : (credToRotate.name === 'default' || isEssentialTier ? null : `credential:${credToRotate.name}`)
    const credAttachments = attachments.filter(a => a.namespace === namespace)
    if (credAttachments.length > 0) {
      uniqueAppNames = [...new Set(credAttachments.map(attachment => attachment.app!.name!))]
        .sort()
        .map(appName => color.app(appName))
        .join(', ')
    }

    return {credAttachments, uniqueAppNames}
  }

  private async getCredsAndAttachments(isAdvancedTier: boolean, addon: AddOn): Promise<{
    attachments: AddOnAttachment[]
    availableCreds: CredentialInfo[],
  }> {
    let availableCreds: CredentialInfo[]
    let attachments: AddOnAttachment[]

    if (isAdvancedTier) {
      [{body: {items: availableCreds}}, {body: attachments}] = await Promise.all([
        this.dataApi.get<CredentialsInfo>(`/data/postgres/v1/${addon.id}/credentials`),
        this.heroku.get<Required<AddOnAttachment>[]>(`/addons/${addon.id}/addon-attachments`),
      ])
    } else {
      [{body: availableCreds}, {body: attachments}] = await Promise.all([
        this.dataApi.get<NonAdvancedCredentialInfo[]>(`/postgres/v0/databases/${addon.id}/credentials`),
        this.heroku.get<Required<AddOnAttachment>[]>(`/addons/${addon.id}/addon-attachments`),
      ])
    }

    return {attachments, availableCreds}
  }

  private getCredToRotate(isAdvancedTier: boolean, availableCreds: CredentialInfo[], isEssentialTier: boolean, credName?: string): {
    credToRotate: CredentialInfo | undefined,
    defaultCred: CredentialInfo | undefined
    ownerCred: CredentialInfo | undefined,
  } {
    let credToRotate: CredentialInfo | undefined
    let ownerCred: CredentialInfo | undefined
    let defaultCred: CredentialInfo | undefined

    if (isAdvancedTier) {
      ownerCred = availableCreds.find((cred: CredentialInfo) => cred.type === 'owner')
      credToRotate = credName ? availableCreds.find((cred: CredentialInfo) => cred.name === credName) : ownerCred
    } else {
      defaultCred = isEssentialTier ? availableCreds[0] : availableCreds.find((cred: CredentialInfo) => cred.name === 'default')
      credToRotate = credName && !isEssentialTier ? availableCreds.find((cred: CredentialInfo) => cred.name === credName) : defaultCred
    }

    return {credToRotate, defaultCred, ownerCred}
  }

  private renderWarnings({
    all,
    credToRotate,
    defaultCred,
    force,
    isAdvancedTier,
    isEssentialTier,
    ownerCred,
  }: {
    all: boolean,
    credToRotate?: CredentialInfo,
    defaultCred?: CredentialInfo,
    force: boolean,
    isAdvancedTier: boolean,
    isEssentialTier: boolean,
    ownerCred?: CredentialInfo,
  }): string[] {
    const warnings: string[] = []
    const defaultCredName = isAdvancedTier ? `owner${color.name(` (${ownerCred?.name ?? ''})`)}` : `${color.name('default')}`
    const isDefaultCred = isAdvancedTier
      ? ownerCred?.name === credToRotate?.name
      : isEssentialTier || defaultCred?.name === credToRotate?.name
    const infoCommand = isAdvancedTier ? 'data:pg:info' : 'pg:info'

    if (!all && credToRotate) {
      warnings.push(`You're rotating the password for the ${color.name(isEssentialTier ? 'default' : credToRotate.name)} credential.`)
    }

    if (all && force) {
      warnings.push(
        `You're force rotating the passwords for all credentials including the ${defaultCredName} credential.`,
      )
    }

    if (all && !force) {
      warnings.push(`You're rotating the passwords for all credentials including the ${defaultCredName} credential.`)
    }

    if (all || force || isDefaultCred) {
      warnings.push('This action resets connections and applications using the credential.')
    } else {
      warnings.push('This action resets connections older than 30 minutes, and uses a temporary rotation username during the process.')
    }

    if (force) {
      warnings.push(
        'You can\'t access any followers lagging in replication until they\'re caught up. '
        + `Use ${color.code(infoCommand)} to track progress.`,
      )
    }

    return warnings
  }
}
