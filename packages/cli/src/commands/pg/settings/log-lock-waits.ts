import {Args} from '@oclif/core'
import heredoc from 'tsheredoc'
import {type BooleanAsString, booleanConverter, PGSettingsCommand} from '../../../lib/pg/setter'
import type {Setting, SettingKey} from '../../../lib/pg/types'
import {nls} from '../../../nls'

export default class LogLockWaits extends PGSettingsCommand {
  static topic = 'pg'
  static description = heredoc(`
    Controls whether a log message is produced when a session waits longer than the deadlock_timeout to acquire a lock. deadlock_timeout is set to 1 second
    Delays due to lock contention occur when multiple transactions are trying to access the same resource at the same time.
    Applications and their query patterns should try to avoid changes to many different tables within the same transaction.
  `)

  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
    value: Args.string({description: 'boolean indicating if a message gets logged when a session waits longer than the deadlock_timeout to acquire a lock'}),
  }

  protected settingKey: SettingKey = 'log_lock_waits'

  protected convertValue(val: unknown): boolean {
    return booleanConverter(val as BooleanAsString)
  }

  protected explain(setting: Setting<unknown>) {
    if (setting.value) {
      return "When a deadlock is detected, a log message will be emitted in your application's logs."
    }

    return "When a deadlock is detected, no log message will be emitted in your application's logs."
  }
}
