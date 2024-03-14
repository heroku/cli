import {Args} from '@oclif/core'
import * as path from 'path'

import {AutocompleteBase} from '../../lib/autocomplete/base'

export default class Script extends AutocompleteBase {
  static description = 'display autocomplete setup script for shell'

  static hidden = true

  static args = {
    shell: Args.string({description: 'shell type', required: false}),
  }

  async run() {
    const {args} = await this.parse(Script)
    const shell = args.shell || this.config.shell
    this.errorIfNotSupportedShell(shell)

    const shellUpcase = shell.toUpperCase()
    this.log(
      `${this.prefix}HEROKU_AC_${shellUpcase}_SETUP_PATH=${path.join(
        this.autocompleteCacheDir,
        `${shell}_setup`,
      )} && test -f $HEROKU_AC_${shellUpcase}_SETUP_PATH && source $HEROKU_AC_${shellUpcase}_SETUP_PATH;`,
    )
  }

  private get prefix(): string {
    return `\n# ${this.config.bin} autocomplete setup\n`
  }
}
