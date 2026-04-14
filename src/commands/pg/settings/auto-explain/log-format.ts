import {Args} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {PGSettingsCommand} from '../../../../lib/pg/setter.js'
import {Setting, SettingKey} from '../../../../lib/pg/types.js'
import {nls} from '../../../../nls.js'

const heredoc = tsheredoc.default

export default class LogFormat extends PGSettingsCommand {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
    value: Args.string({description: 'format of the log output\n<options: text|json|yaml|xml>', options: ['text', 'json', 'yaml', 'xml']}),
  }
  static description = heredoc(`
    selects the EXPLAIN output format to be used
    The allowed values are text, xml, json, and yaml. The default is text.
  `)
  protected settingKey: SettingKey = 'auto_explain.log_format'

  protected convertValue(val: string): string {
    return val
  }

  protected explain(setting: Setting<string>) {
    return `Auto explain log output will log in ${setting.value} format.`
  }
}
