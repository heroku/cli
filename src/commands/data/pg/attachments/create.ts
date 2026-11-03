import type {ResolvedAddOn} from '@heroku/sdk/resources/platform/add-on'
import type {PostgresCredentialListResult, PostgresInfoResult} from '@heroku/types/data'

import {flags as Flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {NotFoundError} from '@heroku/heroku-fetch'
import {databaseCredentialExtensions, postgresDatabaseExtensions} from '@heroku/sdk/extensions/data'
import {NotAdvancedDatabaseError} from '@heroku/sdk/resources/data/postgres-database'
import {Args, ux} from '@oclif/core'
import inquirer from 'inquirer'
import tsheredoc from 'tsheredoc'

import {trapConfirmationRequired} from '../../../../lib/addons/util.js'
import BaseCommand from '../../../../lib/data/base-command.js'
import {sortByLeaderAndName, sortByOwnerAndName} from '../../../../lib/data/credential-utils.js'
import {createSDK} from '../../../../lib/sdk.js'

const {prompt} = inquirer
const heredoc = tsheredoc

type AdvancedCredentials = PostgresCredentialListResult['items']

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

  public async prompt<T extends inquirer.Answers>(...args: Parameters<typeof inquirer.prompt<T>>): Promise<T> {
    return prompt<T>(...args)
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgAttachmentsCreate)
    const {database: databaseArg} = args
    let {app, as, confirm, credential, pool} = flags
    const {data} = createSDK(this.heroku, {extensions: [databaseCredentialExtensions, postgresDatabaseExtensions]})

    let addon: ResolvedAddOn
    let credentials: AdvancedCredentials
    try {
      // For attachment creation, app is always the target app where the attachment will be created.
      // When attaching to the same app, both add-on name and attachment name will resolve without issues
      // by passing the app name for resolution, but when attaching to a different app using the add-on name
      // to specify the source add-on, we have to remove the app name from the resolution for the resolver to
      // find the correct add-on.
      let result
      try {
        result = await data.databaseCredential.list(databaseArg, {appIdentity: app})
      } catch (error) {
        if (!(error instanceof NotFoundError)) {
          throw error
        }

        result = await data.databaseCredential.list(databaseArg)
      }

      addon = result.addon
      credentials = result.credentials.items
    } catch (error) {
      if (error instanceof NotAdvancedDatabaseError) {
        const cmd = `heroku addons:attach ${error.addon.name} -a ${app}${as ? ` --as ${as}` : ''}`
          + `${credential ? ` --credential ${credential}` : ''}`
        ux.error('You can only use this command on Advanced-tier databases.\n'
            + `Use ${color.code(cmd)} instead.`)
      }

      throw error
    }

    if (!credential || !pool || !as) {
      process.stderr.write(heredoc`

        Attach Postgres Advanced database to app
        ${color.disabled('Press Ctrl+C to cancel')}

      `)
    }

    if (credential === undefined) {
      credential = await this.promptCredential(credentials)
    }

    if (pool === undefined) {
      const {pools} = await data.postgres.info(addon.id)
      pool = await this.promptPool(pools)
    }

    if (as === undefined) {
      as = await this.promptAttachmentName()
    }

    const createAttachment = async (confirmed?: string) => {
      const namespaceConfig = {
        pool,
        proxy: 'false',
        role: credential,
      }

      const parts: string[] = []
      if (credential) parts.push(`credential ${color.yellow(credential)}`)
      if (pool) parts.push(`pool ${color.yellow(pool)}`)
      const partsStr = parts.length > 0 ? ` with ${parts.join(' and ')}` : ''
      const attachMessage = `Attaching ${color.addon(addon.name)}${partsStr}${as ? ' as ' + color.attachment(as) : ''} to ${color.app(app)}`

      const body = {
        confirm: confirmed,
        name: as,
        namespace_config: namespaceConfig,
      }

      try {
        ux.action.start(attachMessage)
        const {attachment, releaseVersion} = await data.postgresDatabase.createAttachment(app, `${addon.app.name}::${addon.name}`, body, {
          onAttached(attachment) {
            ux.action.stop()
            ux.action.start(`Setting ${color.attachment(attachment.name!)} config vars and restarting ${color.app(app)}`)
          },
        })
        ux.action.stop(`done, v${releaseVersion}`)

        return attachment
      } catch (error) {
        ux.action.stop(color.red('!'))

        if (error instanceof Error && error.message.includes('invalid credential provided')) {
          ux.error(
            heredoc(`
              The credential ${color.name(credential!)} doesn't exist on the database ${color.datastore(addon.name)}.
              Use ${color.code(`heroku data:pg:credentials ${addon.name} -a ${app}`)} to list the credentials on the database.
            `).trimEnd(),
            {exit: 1},
          )
        }

        if (error instanceof Error && error.message.includes('invalid pool provided')) {
          ux.error(
            heredoc(`
              The pool ${color.name(pool!)} doesn't exist on the database ${color.datastore(addon.name)}.
              Use ${color.code(`heroku data:pg:info ${addon.name} -a ${app}`)} to list the pools on the database.
            `).trimEnd(),
            {exit: 1},
          )
        }

        throw error
      }
    }

    await trapConfirmationRequired(app, confirm, createAttachment)
  }

  private async promptAttachmentName(): Promise<string | undefined> {
    const {attachmentName} = await this.prompt<{attachmentName: string}>({
      message: 'Name for Postgres database attachment, leave blank to randomly generate):',
      name: 'attachmentName',
      type: 'input',
    })
    process.stderr.write('\n')

    return attachmentName.trim() || undefined
  }

  private async promptCredential(credentials: AdvancedCredentials): Promise<string | undefined> {
    const sortedCredentials = sortByOwnerAndName(credentials)

    if (sortedCredentials.length === 0) {
      return undefined
    }

    if (sortedCredentials.length === 1) {
      return sortedCredentials[0].name
    }

    const choices = sortedCredentials.map(cred => {
      const choiceName = cred.type === 'owner' ? `${cred.name} (owner)` : cred.name

      if (cred.state === 'active') {
        return {
          name: choiceName,
          value: cred.name,
        }
      }

      return {
        disabled: 'isn\'t active',
        name: color.disabled(choiceName),
        value: cred.name,
      }
    })

    const {credential} = await this.prompt<{credential: string}>({
      choices,
      message: 'Which credential do you want to use?',
      name: 'credential',
      type: 'list',
    })
    process.stderr.write('\n')

    return credential || undefined
  }

  private async promptPool(pools: PostgresInfoResult['pools']): Promise<string | undefined> {
    const sortedPools = sortByLeaderAndName(pools)

    if (sortedPools.length === 0) {
      return undefined
    }

    if (sortedPools.length === 1) {
      return sortedPools[0].name
    }

    const choices = sortedPools.map(p => {
      const choiceName = `${p.name} (${p.expected_count} @ ${p.expected_level})`

      if (p.status === 'available') {
        return {
          name: choiceName,
          value: p.name,
        }
      }

      return {
        disabled: 'isn\'t available',
        name: color.disabled(choiceName),
        value: p.name,
      }
    })

    const {pool} = await this.prompt<{pool: string}>({
      choices,
      message: 'Which instance pool would you like to attach?',
      name: 'pool',
      type: 'list',
    })
    process.stderr.write('\n')

    return pool || undefined
  }
}
