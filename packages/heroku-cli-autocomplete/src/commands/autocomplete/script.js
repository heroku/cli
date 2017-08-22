// @flow

import path from 'path'
import {AutocompleteBase} from '../../autocomplete'
import AutocompleteInit from './init'

export default class AutocompleteScript extends AutocompleteBase {
  static topic = 'autocomplete'
  static command = 'script'
  static description = 'outputs autocomplete config script for shells'
  // hide until beta release
  static hidden = true
  static args = [{name: 'shell', description: 'shell type', required: false}]

  async run () {
    this.errorIfWindows()
    await AutocompleteInit.run({config: this.config})

    const shell = this.argv[0] || this.config.shell
    if (!shell) {
      this.out.error('Error: Missing required argument shell')
    }

    switch (shell) {
      case 'zsh':
        this._prefix()
        this.out.log(`HEROKU_ZSH_AC_SETUP_PATH=${path.join(this.completionsPath, 'zsh_setup')} && test -f $HEROKU_ZSH_AC_SETUP_PATH && source $HEROKU_ZSH_AC_SETUP_PATH;`)
        break
      case 'bash':
        this._prefix()
        this.out.log(`HEROKU_BASH_AC_SETUP_PATH=${path.join(this.completionsPath, 'bash_setup')} && test -f $HEROKU_BASH_AC_SETUP_PATH && source $HEROKU_BASH_AC_SETUP_PATH;`)
        break
      default:
        this.out.error(`No autocomplete script for ${shell}. Run $ heroku autocomplete for install instructions.`)
    }
  }

  _prefix() {
    this.out.log(`\n# heroku autocomplete setup`)
  }
}
