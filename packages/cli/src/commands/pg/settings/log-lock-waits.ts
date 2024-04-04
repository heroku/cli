import {flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import heredoc from 'tsheredoc'
import {PGSettingsCommand, type Setting} from '../../../lib/pg/setter'
export default class LogLockWaits extends PGSettingsCommand {
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
    database: Args.string(),
    value: Args.boolean(),
  }

  protected settingsName = 'log_lock_waits'

  protected convertValue(val: boolean): boolean {
    return val
  }

  protected explain(setting: Setting) {
    if (setting.value) {
      return "When a deadlock is detected, a log message will be emitted in your application's logs."
    }

    return "When a deadlock is detected, no log message will be emitted in your application's logs."
  }
}
