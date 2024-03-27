import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import heredoc from 'tsheredoc'
import {attachment} from '../../../lib/pg/fetcher'
import host from '../../../lib/pg/host'
import {essentialPlan} from '../../../lib/pg/util'

export default class Create extends Command {
    static topic = 'pg'
    static description = 'create credential within database'
    static help = 'Example:\n\n    heroku pg:credentials:create postgresql-something-12345 --name new-cred-name\n'
    static flags = {
      name: flags.string({char: 'n', required: true, description: 'name of the new credential within the database'}),
      app: flags.app({rezuired: true}),
    }

    static args = {
      database: Args.string(),
    }

    public async run(): Promise<void> {
      const {flags, args} = await this.parse(Create)
      const {app, name} = flags
      const {addon: db} = await attachment(this.heroku, app as string, args.database)
      if (essentialPlan(db)) {
        throw new Error("You can't create a custom credential on Essential-tier databases.")
      }

      const data = {name}
      ux.action.start(`Creating credential ${color.cyan.bold(name)}`)

      await this.heroku.post(`/postgres/v0/databases/${db.name}/credentials`, {hostname: host(), body: data})
      ux.action.stop()

      const attachCmd = `heroku addons:attach ${db.name} --credential ${name} -a ${app}`
      const psqlCmd = `heroku pg:psql ${db.name} -a ${app}`
      ux.log(heredoc(`

      Please attach the credential to the apps you want to use it in by running ${color.cyan.bold(attachCmd)}.
      Please define the new grants for the credential within Postgres: ${color.cyan.bold(psqlCmd)}.`))
    }
}
