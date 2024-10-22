import {Args} from '@oclif/core'
import {PGSettingsCommand} from '../../../../lib/pg/setter'
import {Setting, SettingKey} from '../../../../lib/pg/types'
import heredoc from 'tsheredoc'

export default class LogFormat extends PGSettingsCommand {
  static description = heredoc(`
    selects the EXPLAIN output format to be used
    The allowed values are text, xml, json, and yaml. The default is text.
  `)

  static args = {
    database: Args.string({description: 'config var exposed to the owning app containing the database configuration'}),
    value: Args.string({options: ['text', 'json', 'yaml', 'xml'], description: 'format that should be used for log output.'}),
  }

  protected settingKey: SettingKey = 'auto_explain.log_format'

  protected explain(setting: Setting<string>) {
    return `Auto explain log output will log in ${setting.value} format.`
  }

  protected convertValue(val: string): string {
    return val
  }
}
