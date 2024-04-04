import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {getAddon} from '../../../lib/pg/fetcher'
import {essentialPlan} from '../../../lib/pg/util'
import pgHost from '../../../lib/pg/host'
import {PgDatabaseConfig} from '../../../lib/pg/types'
import heredoc from 'tsheredoc'

export default class LogLockWaits extends Command {
  static topic = 'pg'
  static description = heredoc(`
    Controls whether a log message is produced when a session waits longer than the deadlock_timeout to acquire a lock. deadlock_timeout is set to 1 second
    Delays due to lock contention occur when multiple transactions are trying to access the same resource at the same time.
    Applications and their query patterns should try to avoid changes to many different tables within the same transaction.
  `)

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    value: Args.boolean(),
    database: Args.string(),
  }

  name = 'log_lock_waits'

  explain(setting: PgDatabaseConfig) {
    if (setting.value) {
      return "When a deadlock is detected, a log message will be emitted in your application's logs."
    }

    return "When a deadlock is detected, no log message will be emitted in your application's logs."
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(LogLockWaits)
    const {app} = flags
    const {value, database} = args
    const db = await getAddon(this.heroku, app, database)

    if (essentialPlan(db)) ux.error("You can't perform this operation on Essential-tier databases.")

    if (value) {
      const {body: settings} = await this.heroku.patch<PgDatabaseConfig>(`/postgres/v0/databases/${db.id}/config`, {
        hostname: pgHost(),
        body: {[this.name]: value},
      })
      const setting = settings[this.name]
      ux.log(`${this.name.replace(/_/g, '-')} has been set to ${setting.value} for ${db.name}.`)
      ux.log(this.explain(setting))
    } else {
      const {body: settings} = await this.heroku.get<PgDatabaseConfig>(`/postgres/v0/databases/${db.id}/config`, {hostname: pgHost()})
      const setting = settings[this.name]
      ux.log(`${this.name.replace(/_/g, '-')} is set to ${setting.value} for ${db.name}.`)
      ux.log(this.explain(setting))
    }
  }
}
