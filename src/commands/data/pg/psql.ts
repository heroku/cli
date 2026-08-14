import {Command, flags as Flags} from '@heroku-cli/command'
import {color, utils} from '@heroku/heroku-cli-util'
import {Args} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {runPsqlThroughOneOffDyno} from '../../../lib/pg/one-off-dyno.js'

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
      description: heredoc('override the default channel binding behavior (required). '
        + 'Can be "disable" to disable channel binding if you run into compatibility issues with your libpq version '
        + 'or if it was compiled without SSL support.'),
      hidden: true,
      options: ['disable', 'require'],
    }),
    command: Flags.string({char: 'c', description: 'SQL command to run'}),
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
    const {'channel-binding': channelBinding, command, file} = flags
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const db = await dbResolver.getDatabase(flags.app, databaseArg)

    if (utils.pg.isPrivateNetworkDatabase(db.attachment!.addon)) {
      return runPsqlThroughOneOffDyno({
        channelBinding: channelBinding as 'disable' | 'require',
        command,
        db,
        file,
        heroku: this.heroku,
        notificationSubtitle: 'heroku data:pg:psql',
      })
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
}
