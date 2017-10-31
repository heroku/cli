// @flow

import path from 'path'
import {AutocompleteBase} from '../../autocomplete'
import cli from 'cli-ux'

export default class AutocompleteScript extends AutocompleteBase {
  static topic = 'autocomplete'
  static command = 'script'
  static description = 'outputs autocomplete config script for shells'
  // hide until public release
  static hidden = true
  static args = [{name: 'shell', description: 'shell type', required: false}]

  async run () {
    this.errorIfWindows()

    const shell = this.argv[0] || this.config.shell
    if (!shell) {
      cli.error('Error: Missing required argument shell')
    }

    if (shell === 'bash' || shell === 'zsh') {
      let shellUpcase = shell.toUpperCase()
      cli.log(`${this._prefix}CLI_ENGINE_AC_${shellUpcase}_SETUP_PATH=${path.join(this.completionsCachePath, `${shell}_setup`)} && test -f $CLI_ENGINE_AC_${shellUpcase}_SETUP_PATH && source $CLI_ENGINE_AC_${shellUpcase}_SETUP_PATH;`)
    } else {
      cli.error(`No autocomplete script for ${shell}. Run $ ${this.config.bin} autocomplete for install instructions.`)
    }
  }

  get _prefix (): string {
    return `\n# ${this.config.bin} autocomplete setup\n`
  }
}
