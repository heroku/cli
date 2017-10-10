// @flow

import Command from 'cli-engine-command'
import path from 'path'
import moment from 'moment'
import cli from 'cli-ux'

export class AutocompleteBase extends Command<*> {
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

  get completionsCachePath (): string {
    return path.join(this.config.cacheDir, 'completions')
  }

  get acLogfile (): string {
    return path.join(this.config.cacheDir, 'autocomplete.log')
  }

  writeLogFile (msg: string) {
    cli.stdout.constructor.logToFile(`[${moment().format()}] ${msg}\n`, this.acLogfile)
  }
}
