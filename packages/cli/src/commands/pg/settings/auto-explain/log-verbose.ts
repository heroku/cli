import {flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import heredoc from 'tsheredoc'
import {type BooleanAsString, booleanConverter, PGSettingsCommand} from '../../../../lib/pg/setter'
import type {Setting, SettingKey} from '../../../../lib/pg/types'

export default class AutoExplainLogVerbose extends PGSettingsCommand {
  static topic = 'pg'
  static description = heredoc(
    `Include verbose details in execution plans.
    This is equivalent to calling EXPLAIN VERBOSE.`)

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string({description: 'add-on ID, config var name, provider ID, plan name or globally unique name of the database add-on. If omitted, we use DATABASE_URL.'}),
    value: Args.string({description: 'boolean indicating whether verbose execution plan logging should be enabled.'}),
  }

  protected settingKey: SettingKey = 'auto_explain.log_verbose'

  protected explain(setting: Setting<unknown>) {
    if (setting.value) {
      return 'Verbose execution plan logging has been enabled for auto_explain.'
    }

    return 'Verbose execution plan logging has been disabled for auto_explain.'
  }

  protected convertValue(val: unknown): boolean {
    return booleanConverter(val as BooleanAsString)
  }
}
