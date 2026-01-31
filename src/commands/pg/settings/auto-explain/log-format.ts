import {Args} from '@oclif/core'
import {PGSettingsCommand} from '../../../../lib/pg/setter.js'
import {Setting, SettingKey} from '../../../../lib/pg/types.js'
import tsheredoc from 'tsheredoc'
import {nls} from '../../../../nls.js'

const heredoc = tsheredoc.default

export default class LogFormat extends PGSettingsCommand {
  static description = heredoc(`
    selects the EXPLAIN output format to be used
    The allowed values are text, xml, json, and yaml. The default is text.
  `)

  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
    value: Args.string({options: ['text', 'json', 'yaml', 'xml'], description: 'format of the log output\n<options: text|json|yaml|xml>'}),
  }

  protected settingKey: SettingKey = 'auto_explain.log_format'

  protected explain(setting: Setting<string>) {
    return `Auto explain log output will log in ${setting.value} format.`
  }

  protected convertValue(val: string): string {
    return val
  }
}
