import {flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import heredoc from 'tsheredoc'
import {booleanConverter, PGSettingsCommand, type Setting, type SettingKey} from '../../../../lib/pg/setter'

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
    database: Args.string(),
    value: Args.string(),
  }

  protected settingKey: SettingKey = 'auto_explain.log_verbose'

  protected explain(setting: Setting) {
    if (setting.value) {
      return 'Verbose execution plan logging has been enabled for auto_explain.'
    }

    return 'Verbose execution plan logging has been disabled for auto_explain.'
  }

  protected convertValue(val: boolean): boolean {
    return booleanConverter(val)
  }
}
