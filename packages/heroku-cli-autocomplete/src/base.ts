import Command, {flags} from '@heroku-cli/command'
import * as fs from 'fs-extra'
import * as moment from 'moment'
import * as path from 'path'

import {CompletionAliases, CompletionBlacklist, CompletionMapping, CompletionVariableArgsLookup} from './completions'

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
    let entry = `[${moment().format()}] ${msg}\n`
    let fd = fs.openSync(this.acLogfilePath, 'a')
    // @ts-ignore
    fs.write(fd, entry)
  }

  protected findCompletion(name: string, id: string): flags.ICompletion | undefined {
    if (this.blacklisted(name, id)) return
    if (CompletionVariableArgsLookup[id]) return CompletionMapping[CompletionVariableArgsLookup[id]]
    const alias = this.convertIfAlias(name)
    if (CompletionMapping[alias]) return CompletionMapping[alias]
  }

  private blacklisted(name: string, id: string): boolean {
    return CompletionBlacklist[name] && CompletionBlacklist[name].includes(id)
  }

  private convertIfAlias(name: string): string {
    let alias = CompletionAliases[name]
    if (alias) return alias
    return name
  }
}
