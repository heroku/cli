import {color, pg, utils} from '@heroku/heroku-cli-util'
import {Command, flags as Flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import Dyno, {DynoOpts} from '../../../lib/run/dyno.js'

const heredoc = tsheredoc.default

export default class DataPgPsql extends Command {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }

  static description = 'open a psql shell to the database'

  static examples = ['<%= config.bin %> <%= command.id %> database_name -a example-app']

  static flags = {
    app: Flags.app({required: true}),
    // prevent MITM attacks.
    'channel-binding': Flags.string({
      default: 'require',
      description: heredoc(
        'override the default channel binding behavior (required). '
        + 'Can be "disable" to disable channel binding if you run into compatibility issues with your libpq version '
        + 'or if it was compiled without SSL support.',
      ),
      hidden: true,
      options: ['disable', 'require'],
    }),
    command: Flags.string({char: 'c', description: 'SQL command to run'}),
    credential: Flags.string({description: 'credential to use'}),
    file: Flags.string({char: 'f', description: 'SQL file to run'}),
    // If channel-binding is set it will override the default channel binding
    // behavior (required). Customers can set this to "disable" to disable channel
    // binding if they run into compatibility issues with their libpq version or if
    // it was compiled without SSL support.
    //
    // Ideally we should work with customers to upgrade their libpq versions and
    // enable SSL support as channel-binding is a more secure option and helps to
    remote: Flags.remote(),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgPsql)
    const {database: databaseArg} = args
    const {app, 'channel-binding': channelBinding, command, credential, file} = flags
    const namespace = credential ? `role:${credential}` : undefined
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    let db: pg.ConnectionDetails

    try {
      db = await dbResolver.getDatabase(app, databaseArg, namespace)
    } catch (error) {
      if (namespace && error instanceof Error && error.message === "Couldn't find that addon.") {
        const addonResolver = new utils.AddonResolver(this.heroku)
        const addon = await addonResolver.resolve(databaseArg, app, utils.pg.addonService())
        const credCommand = utils.pg.isAdvancedDatabase(addon) ? 'data:pg:credentials' : 'pg:credentials'
        throw new Error(`The credential ${credential} doesn't exist on the database ${databaseArg}. Run ${color.code(`heroku ${credCommand} ${addon.name}`)} to list the credentials on the database.`)
      }

      throw error
    }

    if (utils.pg.isAdvancedPrivateDatabase(db.attachment!.addon)) {
      if (file)
        ux.error('You can\'t use the --file flag on private networked Advanced databases.', {exit: 1})

      let psqlCommand: string

      if (command) {
        psqlCommand = `psql -c "${command.replaceAll('"', '\\"')}" --set sslmode=require `
          + `--set channel_binding=${channelBinding} $${db.attachment!.name}_URL`
      } else {
        const prompt = `${db.attachment!.app.name}::${db.attachment!.name}%R%# `
        psqlCommand = `psql --set PROMPT1="${prompt}" --set PROMPT2="${prompt}" --set sslmode=require `
          + `--set channel_binding=${channelBinding} $${db.attachment!.name}_URL`
      }

      const opts = {
        app,
        attach: true,
        command: psqlCommand,
        env: `PGAPPNAME='psql ${command ? 'non-' : ''}interactive';PGSSLMODE=require;PGCHANNELBINDING=${channelBinding}`,
        'exit-code': true,
        heroku: this.heroku,
        'no-tty': false,
        notificationSubtitle: 'heroku data:pg:psql',
        notify: false,
        showStatus: false,
      }

      return this.runThroughOneOffDyno(opts)
    }

    const psqlService = new utils.pg.PsqlService(db)

    console.error(`--> Connecting to ${color.yellow(db.attachment!.addon.name)}`)

    const cmdArgs = [
      '--set',
      `channel_binding=${channelBinding}`,
    ]

    if (command) {
      const output = await psqlService.execQuery(command, cmdArgs)
      process.stdout.write(output)
    } else if (file) {
      const output = await psqlService.execFile(file, cmdArgs)
      process.stdout.write(output)
    } else
      await psqlService.interactiveSession(cmdArgs)
  }

  public async runThroughOneOffDyno(opts: DynoOpts): Promise<void> {
    const dyno = new Dyno(opts)
    try {
      await dyno.start()
    } catch (error: unknown) {
      const dynoError = error as {exitCode?: number} & Error
      if (dynoError.exitCode) {
        ux.error(dynoError.message, {code: String(dynoError.exitCode), exit: dynoError.exitCode})
      } else {
        throw error
      }
    }
  }
}
