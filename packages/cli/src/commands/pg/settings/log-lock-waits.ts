import {Args} from '@oclif/core'
import heredoc from 'tsheredoc'
import {PGSettingsCommand, type Setting, booleanConverter, SettingKey} from '../../../lib/pg/setter'

export default class LogLockWaits extends PGSettingsCommand {
  static topic = 'pg'
  static description = heredoc(`
    Controls whether a log message is produced when a session waits longer than the deadlock_timeout to acquire a lock. deadlock_timeout is set to 1 second
    Delays due to lock contention occur when multiple transactions are trying to access the same resource at the same time.
    Applications and their query patterns should try to avoid changes to many different tables within the same transaction.
  `)

  static args = {
    database: Args.string(),
    value: Args.string(),
  }

  protected settingKey: SettingKey = 'log_lock_waits'

  protected convertValue(val: boolean): boolean {
    return booleanConverter(val)
  }

  protected explain(setting: Setting) {
    if (setting.value) {
      return "When a deadlock is detected, a log message will be emitted in your application's logs."
    }

    return "When a deadlock is detected, no log message will be emitted in your application's logs."
  }
}
