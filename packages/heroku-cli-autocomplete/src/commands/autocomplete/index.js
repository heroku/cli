// @flow

import {AutocompleteBase} from '../../autocomplete'
import {CustomColors} from 'cli-engine-command/lib/output'

export default class Autocomplete extends AutocompleteBase {
  static topic = 'autocomplete'
  static description = 'display autocomplete instructions'
  // hide until beta release
  static hidden = true
  static args = [{name: 'shell', description: 'shell type', required: false}]

  async run () {
    this.errorIfWindows()

    const shell = this.argv[0] || this.config.shell
    if (!shell) {
      this.out.error('Error: Missing required argument shell')
    }

    switch (shell) {
      // for now, suspending bash completion
      //       case 'bash':
      //         const cmd = CustomColors.cmd(`$ printf $(heroku autocomplete:script bash) >> ~/.bashrc`)
      //         this.out.log(`Add the autocomplete setup script to your .bashrc or .bash_profile via:
      //
      // ${cmd}`)
      //         break
      case 'zsh':
        const cmd1 = CustomColors.cmd(`$ printf $(heroku autocomplete:script zsh) >> ~/.zshrc`)
        const cmd2 = CustomColors.cmd(`$ compaudit`)
        this.out.log(`Add the autocomplete setup script to your .zshrc via:

${cmd1}

Run the following zsh command to ensure no permissions conflicts:

${cmd2}`)
        break
      default:
        this.out.error(`Currently ${shell} is not a supported shell for autocomplete`)
    }
    this.out.log('\nLastly, restart your shell')
  }
}
