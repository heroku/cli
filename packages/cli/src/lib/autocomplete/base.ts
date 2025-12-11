import {Command} from '@heroku-cli/command'
// @ts-expect-error - type definition may not be available in current TypeScript setup
import type {Completion} from '@oclif/core/lib/interfaces/parser'
import fs from 'fs-extra'
import * as path from 'path'

import {CompletionLookup} from './completions.js'

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

  async writeLogFile(msg: string) {
    const now = new Date()
    const entry = `[${now}] ${msg}\n`
    await fs.appendFile(this.acLogfilePath, entry)
  }

  protected findCompletion(cmdId: string, name: string, description = ''): Completion | undefined {
    return new CompletionLookup(cmdId, name, description).run()
  }
}
