import {color, utils} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import {nls} from '../../nls.js'

export default class Psql extends Command {
  static description = 'open a psql shell to the database'
  static flags = {
    command: flags.string({char: 'c', description: 'SQL command to run'}),
    file: flags.string({char: 'f', description: 'SQL file to run'}),
    credential: flags.string({description: 'credential to use'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }

  static aliases = ['psql']

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Psql)
    const {app, command, credential, file} = flags
    const namespace = credential ? `credential:${credential}` : undefined
    let db
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    try {
      db = await dbResolver.getDatabase(app, args.database, namespace)
    } catch (error) {
      if (namespace && error instanceof Error && error.message === "Couldn't find that addon.") {
        throw new Error("Credential doesn't match, make sure credential is attached")
      }

      throw error
    }

    const psqlService = new utils.pg.PsqlService(db)

    console.error(`--> Connecting to ${color.datastore(db.attachment!.addon.name)}`)
    if (command) {
      const output = await psqlService.execQuery(command)
      process.stdout.write(output)
    } else if (file) {
      const output = await psqlService.execFile(file)
      process.stdout.write(output)
    } else {
      await psqlService.interactiveSession()
    }
  }
}
