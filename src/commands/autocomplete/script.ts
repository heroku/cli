import {Args} from '@oclif/core'
import path from 'node:path'

import {AutocompleteBase} from '../../lib/autocomplete/base.js'

export default class Script extends AutocompleteBase {
  static args = {
    shell: Args.string({description: 'shell type', required: false}),
  }
  static description = 'display autocomplete setup script for shell'
  static hidden = true

  private get prefix(): string {
    return `\n# ${this.config.bin} autocomplete setup\n`
  }

  async run() {
    const {args} = await this.parse(Script)
    const shell = args.shell || this.config.shell
    this.errorIfNotSupportedShell(shell)

    const shellUpcase = shell.toUpperCase()
    this.log(`${this.prefix}HEROKU_AC_${shellUpcase}_SETUP_PATH=${path.join(
      this.autocompleteCacheDir,
      `${shell}_setup`,
    )} && test -f $HEROKU_AC_${shellUpcase}_SETUP_PATH && source $HEROKU_AC_${shellUpcase}_SETUP_PATH;`)
  }
}
