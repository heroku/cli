import type {AddOnAttachment} from '@heroku/types/3.sdk'
import type {PostgresCredentialInfoResult as AdvancedCredentialInfo} from '@heroku/types/data'

import {flags as Flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {databaseCredentialExtensions} from '@heroku/sdk/extensions/data'
import {isAdvancedCredential, CredentialInfo as NonAdvancedCredentialInfo, parseAttachmentFactors} from '@heroku/sdk/resources/data/postgres-database'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../../../lib/data/base-command.js'
import {createSDK} from '../../../../lib/sdk.js'

type CredentialInfo = AdvancedCredentialInfo | NonAdvancedCredentialInfo

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
    const {data} = createSDK(this.heroku, {extensions: [databaseCredentialExtensions]})
    const {confirmCommand, getCredAttachmentsAndUniqueAppNames, renderWarnings} = this

    try {
      await data.databaseCredential.rotate(database, {all, credName: name, forced: force}, {
        appIdentity: app,
        async beforeRotate(preview) {
          const {
            addon,
            attachments,
            credToRotate,
            defaultCred,
            isAdvancedTier,
            isEssentialTier,
            ownerCred,
          } = preview

          const warnings = isAdvancedTier
            ? renderWarnings({
              all, credToRotate, force, isAdvancedTier, isEssentialTier, ownerCred,
            })
            : renderWarnings({
              all, credToRotate, defaultCred, force, isAdvancedTier, isEssentialTier,
            })

          if (credToRotate && !all) {
            const {credAttachments, uniqueAppNames} = getCredAttachmentsAndUniqueAppNames(isEssentialTier, credToRotate, attachments)
            if (credAttachments.length > 0) {
              warnings.push(`This command will affect the app${(credAttachments.length > 1) ? 's' : ''} ${uniqueAppNames}.`)
            }
          }

          await confirmCommand({comparison: app, confirmation: confirm, warningMessage: `Destructive Action\n${warnings.join('\n')}`})

          if (all) {
            ux.action.start(`Rotating all credentials on ${color.datastore(addon.name)}`)
            return
          }

          const finalCredName = isEssentialTier ? 'default' : credToRotate?.name
          if (!finalCredName) {
            ux.error(`There are no credentials on the database ${color.datastore(addon.name)}.`, {exit: 1})
          }

          ux.action.start(`Rotating ${color.name(finalCredName)} on ${color.datastore(addon.name)}`)
        },
      })
      ux.action.stop()
    } catch (error) {
      ux.action.stop('!')
      throw error
    }
  }

  private getCredAttachmentsAndUniqueAppNames(
    isEssentialTier: boolean,
    credToRotate: CredentialInfo,
    attachments: AddOnAttachment[],
  ): {
    credAttachments: AddOnAttachment[],
    uniqueAppNames: string
  } {
    let uniqueAppNames = ''
    const credAttachments = attachments.filter(a => {
      if (isAdvancedCredential(credToRotate)) {
        const attachmentRoleFactor = parseAttachmentFactors(a.namespace).role
        return attachmentRoleFactor === credToRotate.name || (credToRotate.type === 'owner' && !attachmentRoleFactor)
      }

      return (
        a.namespace === `credential:${credToRotate.name}`
        || (!a.namespace && (credToRotate.name === 'default' || isEssentialTier))
      )
    })

    if (credAttachments.length > 0) {
      uniqueAppNames = [...new Set(credAttachments.map(attachment => attachment.app!.name!))]
        .sort()
        .map(appName => color.app(appName))
        .join(', ')
    }

    return {credAttachments, uniqueAppNames}
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
      warnings.push(`You're force rotating the passwords for all credentials including the ${defaultCredName} credential.`)
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
      warnings.push('You can\'t access any followers lagging in replication until they\'re caught up. '
        + `Use ${color.code(infoCommand)} to track progress.`)
    }

    return warnings
  }
}
