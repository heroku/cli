import type {pg} from '@heroku/heroku-cli-util'

import {flags as Flags, HerokuAPIError} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as color from '@heroku/heroku-cli-util/color'
import {AddonResolver, getAddonService, isAdvancedDatabase} from '@heroku/heroku-cli-util/utils'
import {Args, ux} from '@oclif/core'
import inquirer from 'inquirer'
import tsheredoc from 'tsheredoc'

import {trapConfirmationRequired} from '../../../../lib/addons/util.js'
import BaseCommand from '../../../../lib/data/baseCommand.js'
import {sortByLeaderAndName, sortByOwnerAndName} from '../../../../lib/data/credentialUtils.js'
import {
  AdvancedCredentialState, type CredentialsInfo, type InfoResponse, PoolStatus,
} from '../../../../lib/data/types.js'

// eslint-disable-next-line import/no-named-as-default-member
const {prompt} = inquirer
const heredoc = tsheredoc.default

export default class DataPgAttachmentsCreate extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }

  static baseFlags = BaseCommand.baseFlagsWithoutPrompt()

  static description = 'attach an existing Postgres Advanced database to an app'

  static examples = [
    '<%= config.bin %> <%= command.id %> database_name --app example-app',
  ]

  static flags = {
    app: Flags.app({required: true}),
    as: Flags.string({description: 'name for Postgres database attachment'}),
    confirm: Flags.string({char: 'c', description: 'pass in the app name to skip confirmation prompts'}),
    credential: Flags.string({
      description: 'credential to use for database',
    }),
    pool: Flags.string({description: 'instance pool to attach'}),
    remote: Flags.remote(),
  }

  static promptFlagActive = false

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgAttachmentsCreate)
    const {database: databaseArg} = args
    let {app, as, confirm, credential, pool} = flags
    const addonResolver = new AddonResolver(this.heroku)

    // For attachment creation, app is always the target app where the attachment will be created.
    // When attaching to the same app, both add-on name and attachment name will resolve without issues
    // by passing the app name for resolution, but when attaching to a different app using the add-on name
    // to specify the source add-on, we have to remove the app name from the resolution for the resolver to
    // find the correct add-on.
    let addon: pg.ExtendedAddon
    try {
      addon = await addonResolver.resolve(databaseArg, app, getAddonService())
    } catch (error: unknown) {
      if (error instanceof HerokuAPIError && error.http.statusCode === 404) {
        addon = await addonResolver.resolve(databaseArg, undefined, getAddonService())
      } else {
        throw error
      }
    }

    if (!isAdvancedDatabase(addon)) {
      const cmd = `heroku addons:attach ${addon.name} -a ${app}${as ? ` --as ${as}` : ''}`
        + `${credential ? ` --credential ${credential}` : ''}`
      ux.error(
        'You can only use this command on Advanced-tier databases.\n'
          + `Run ${color.code(cmd)} instead.`,
      )
    }

    process.stderr.write(heredoc`

      Attach Postgres Advanced database to app
      ${color.disabled('Press Ctrl+C to cancel')}

    `)

    if (credential === undefined) {
      credential = await this.promptCredential(addon.id)
    }

    if (pool === undefined) {
      pool = await this.promptPool(addon.id)
    }

    if (as === undefined) {
      as = await this.promptAttachmentName()
    }

    const createAttachment = async (confirmed?: string): Promise<Required<Heroku.AddOnAttachment>> => {
      const namespaceConfig = {
        pool,
        proxy: 'false',
        role: credential,
      }

      const parts: string[] = []
      if (credential) parts.push(`credential ${color.yellow(credential)}`)
      if (pool) parts.push(`pool ${color.yellow(pool)}`)
      const partsStr = parts.length > 0 ? ` with ${parts.join(' and ')} ` : ''
      const attachMessage = `Attaching ${color.addon(addon.name)}${partsStr}${as ? ' as ' + color.attachment(as) : ''} to ${color.app(app)}`

      const body = {
        addon: {name: addon.name},
        app: {name: app},
        confirm: confirmed,
        name: as,
        namespace_config: namespaceConfig,
      }

      try {
        ux.action.start(attachMessage)
        const {body: attachment} = await this.heroku.post<Required<Heroku.AddOnAttachment>>('/addon-attachments', {body})
        ux.action.stop()

        return attachment
      } catch (error) {
        ux.action.stop(color.red('!'))

        if (error instanceof Error && error.message.includes('invalid credential provided')) {
          ux.error(
            heredoc(`
              The credential ${color.name(credential)} doesn't exist on the database ${color.datastore(addon.name)}.
              Run ${color.command(`heroku data:pg:credentials ${addon.name} -a ${app}`)} to list the credentials on the database.
            `).trimEnd(),
            {exit: 1},
          )
        }

        if (error instanceof Error && error.message.includes('invalid pool provided')) {
          ux.error(
            heredoc(`
              The pool ${color.name(pool)} doesn't exist on the database ${color.datastore(addon.name)}.
              Run ${color.command(`heroku data:pg:info ${addon.name} -a ${app}`)} to list the pools on the database.
            `).trimEnd(),
            {exit: 1},
          )
        }

        throw error
      }
    }

    const attachment = await trapConfirmationRequired<Required<Heroku.AddOnAttachment>>(app, confirm, (confirmed?: string) => createAttachment(confirmed))

    try {
      ux.action.start(`Setting ${color.attachment(attachment.name)} config vars and restarting ${color.app(app)}`)
      const {body: releases} = await this.heroku.get<Required<Heroku.Release>[]>(
        `/apps/${app}/releases`, {
          headers: {Range: 'version ..; max=1, order=desc'}, partial: true,
        },
      )
      ux.action.stop(`done, v${releases[0].version}`)
    } catch (error) {
      ux.action.stop(color.red('!'))
      throw error
    }
  }

  private async promptAttachmentName(): Promise<string | undefined> {
    const {attachmentName} = await prompt<{attachmentName: string}>({
      message: 'Name for Postgres database attachment, leave blank to randomly generate):',
      name: 'attachmentName',
      type: 'input',
    })
    process.stderr.write('\n')

    return attachmentName.trim() || undefined
  }

  private async promptCredential(addonId: string): Promise<string | undefined> {
    const {body: {items: credentials}} = await this.dataApi.get<CredentialsInfo>(
      `/data/postgres/v1/${addonId}/credentials`,
    )
    const sortedCredentials = sortByOwnerAndName(credentials)

    if (sortedCredentials.length === 0) {
      return undefined
    }

    if (sortedCredentials.length === 1) {
      return sortedCredentials[0].name
    }

    const choices = sortedCredentials.map(cred => ({
      disabled: cred.state === AdvancedCredentialState.ACTIVE ? false : 'isn\'t active',
      name: cred.type === 'owner' ? `${cred.name} (owner)` : cred.name,
      value: cred.name,
    }))

    const {credential} = await prompt<{credential: string}>({
      choices,
      message: 'Which credential do you want to use?',
      name: 'credential',
      type: 'list',
    })
    process.stderr.write('\n')

    return credential || undefined
  }

  private async promptPool(addonId: string): Promise<string | undefined> {
    const {body: {pools}} = await this.dataApi.get<InfoResponse>(`/data/postgres/v1/${addonId}/info`)

    const sortedPools = sortByLeaderAndName(pools)

    if (sortedPools.length === 0) {
      return undefined
    }

    if (sortedPools.length === 1) {
      return sortedPools[0].name
    }

    const choices = sortedPools.map(p => ({
      disabled: p.status === PoolStatus.AVAILABLE ? false : 'isn\'t available',
      name: `${p.name} (${p.expected_count} @ ${p.expected_level})`,
      value: p.name,
    }))

    const {pool} = await prompt<{pool: string}>({
      choices,
      message: 'Which instance pool would you like to attach?',
      name: 'pool',
      type: 'list',
    })
    process.stderr.write('\n')

    return pool || undefined
  }
}
