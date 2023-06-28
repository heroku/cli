import Command from '@heroku-cli/command'
import * as fs from 'fs-extra'
import * as path from 'path'

import {CompletionLookup} from './completions'
import {Interfaces} from '@oclif/core'

export abstract class AutocompleteBase extends Command {
  public errorIfWindows() {
    if (this.config.windows) {
      throw new Error('Autocomplete is not currently supported in Windows')
    }
  }

  public errorIfNotSupportedShell(shell: string) {
    if (!shell) {
      this.error('Missing required argument shell')
    }

    this.errorIfWindows()
    if (!['bash', 'zsh'].includes(shell)) {
      throw new Error(`${shell} is not a supported shell for autocomplete`)
    }
  }

  public get autocompleteCacheDir(): string {
    return path.join(this.config.cacheDir, 'autocomplete')
  }

  public get completionsCacheDir(): string {
    return path.join(this.config.cacheDir, 'autocomplete', 'completions')
  }

  public get acLogfilePath(): string {
    return path.join(this.config.cacheDir, 'autocomplete.log')
  }

  writeLogFile(msg: string) {
    const now = new Date()
    const entry = `[${now}] ${msg}\n`
    const fd = fs.openSync(this.acLogfilePath, 'a')
    // eslint-disable-next-line
    // @ts-ignore
    fs.write(fd, entry)
  }

  protected findCompletion(cmdId: string, name: string, description = ''): Interfaces.Completion | undefined {
    return new CompletionLookup(cmdId, name, description).run()
  }
}
