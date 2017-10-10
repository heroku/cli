// @flow

import path from 'path'
import {AutocompleteBase} from '../../autocomplete'
import AutocompleteInit from './init'
import cli from 'cli-ux'

export default class AutocompleteScript extends AutocompleteBase {
  static topic = 'autocomplete'
  static command = 'script'
  static description = 'outputs autocomplete config script for shells'
  // hide until beta release
  static hidden = true
  static args = [{name: 'shell', description: 'shell type', required: false}]

  async run () {
    this.errorIfWindows()
    await AutocompleteInit.run(Object.assign(this.config, {argv: []}))

    const shell = this.argv[0] || this.config.shell
    if (!shell) {
      cli.error('Error: Missing required argument shell')
    }

    switch (shell) {
      case 'zsh':
        cli.log(`${this._prefix}HEROKU_ZSH_AC_SETUP_PATH=${path.join(this.completionsPath, 'zsh_setup')} && test -f $HEROKU_ZSH_AC_SETUP_PATH && source $HEROKU_ZSH_AC_SETUP_PATH;`)
        break
      // for now, suspending bash completion
      // case 'bash':
      //   cli.log(`${this._prefix}HEROKU_BASH_AC_SETUP_PATH=${path.join(this.completionsPath, 'bash_setup')} && test -f $HEROKU_BASH_AC_SETUP_PATH && source $HEROKU_BASH_AC_SETUP_PATH;`)
      //   break
      default:
        cli.error(`No autocomplete script for ${shell}. Run $ heroku autocomplete for install instructions.`)
    }
  }

  get _prefix (): string {
    return '\\n# heroku autocomplete setup\\n'
  }
}
