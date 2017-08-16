// @flow

import Command from 'cli-engine-command'
import path from 'path'

export class AutocompleteBase extends Command {
  get functionsPath (): string {
    return path.join(__dirname, '..', '..', '..', 'autocomplete')
  }

  get completionsPath (): string {
    return path.join(this.config.cacheDir, 'completions')
  }

  errorIfWindows () {
    if (this.config.windows) {
      this.out.error('Autocomplete is not currently supported in Windows')
    }
  }
}
