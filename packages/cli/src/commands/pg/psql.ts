import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import {database} from '../../lib/pg/fetcher'
import {exec, execFile, interactive} from '../../lib/pg/psql'

export default class Psql extends Command {
    static description = 'open a psql shell to the database';
    static flags = {
      command: flags.string({char: 'c', description: 'SQL command to run'}),
      file: flags.string({char: 'f', description: 'SQL file to run'}),
      credential: flags.string({description: 'credential to use'}),
      app: flags.app({required: true}),
      remote: flags.remote(),
    };

    static args = {
      database: Args.string(),
    };

    static aliases = ['psql']

    public async run(): Promise<void> {
      const {flags, args} = await this.parse(Psql)
      const {app, command, credential, file} = flags
      const namespace = credential ? `credential:${credential}` : undefined
      let db
      try {
        db = await database(this.heroku, app, args.database, namespace)
      } catch (error) {
        if (namespace && error instanceof Error && error.message === "Couldn't find that addon.") {
          throw new Error("Credential doesn't match, make sure credential is attached")
        }

        throw error
      }

      console.error(`--> Connecting to ${color.yellow(db.attachment.addon.name)}`)
      if (command) {
        const output = await exec(db, command)
        process.stdout.write(output)
      } else if (file) {
        const output = await execFile(db, file)
        process.stdout.write(output)
      } else {
        await interactive(db)
      }
    }
}
