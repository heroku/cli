import {Command} from '@oclif/core'
import fs from 'fs-extra'
import * as path from 'path'
import {fileURLToPath} from 'node:url'
import debug from 'debug'

import {AutocompleteBase} from '../../lib/autocomplete/base.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const debugLog = debug('autocomplete:create')

const AC_LIB_PATH = path.resolve(__dirname, '..', '..', '..', 'autocomplete-scripts')

export default class Create extends AutocompleteBase {
  static hidden = true

  static description = 'create autocomplete setup scripts and completion functions'

  private _commands?: Command.Loadable[]

  async run() {
    this.errorIfWindows()
    // 1. ensure needed dirs
    await this.ensureDirs()
    // 2. save (generated) autocomplete files
    await this.createFiles()
  }

  private async ensureDirs() {
    // ensure autocomplete cache dir
    await fs.ensureDir(this.autocompleteCacheDir)
    // ensure autocomplete completions dir
    await fs.ensureDir(this.completionsCacheDir)
  }

  private async createFiles() {
    await fs.writeFile(this.bashSetupScriptPath, this.bashSetupScript)
    await fs.writeFile(this.zshSetupScriptPath, this.zshSetupScript)
    await fs.writeFile(this.bashCommandsListPath, this.bashCommandsList)
    await fs.writeFile(this.zshCompletionSettersPath, this.zshCompletionSetters)
  }

  private get bashSetupScriptPath(): string {
    // <cacheDir>/autocomplete/bash_setup
    // Match test expectation: ${cacheDir}/autocomplete/bash_setup
    return `${this.config.cacheDir}/autocomplete/bash_setup`
  }

  private get bashCommandsListPath(): string {
    // <cacheDir>/autocomplete/commands
    return `${this.config.cacheDir}/autocomplete/commands`
  }

  private get zshSetupScriptPath(): string {
    // <cacheDir>/autocomplete/zsh_setup
    return `${this.config.cacheDir}/autocomplete/zsh_setup`
  }

  private get zshCompletionSettersPath(): string {
    // <cacheDir>/autocomplete/commands_setters
    return `${this.config.cacheDir}/autocomplete/commands_setters`
  }

  private get skipEllipsis(): boolean {
    return process.env.HEROKU_AC_ZSH_SKIP_ELLIPSIS === '1'
  }

  private get commands(): Command.Loadable[] {
    if (this._commands) return this._commands

    const {plugins} = this.config
    const commands: Command.Loadable[] = []

    plugins.forEach(p => {
      p.commands.forEach(c => {
        if (c.hidden) return
        try {
          commands.push(c)
        } catch (error: any) {
          debugLog(`Error creating completions for command ${c.id}`)
          debugLog(error.message)
          this.writeLogFile(error.message).catch(() => {})
        }
      })
    })

    this._commands = commands
    return this._commands
  }

  private get bashCommandsList(): string {
    return this.commands.map(c => {
      try {
        const publicFlags = this.genCmdPublicFlags(c).trim()
        return `${c.id} ${publicFlags}`
      } catch (error: any) {
        debugLog(`Error creating bash completion for command ${c.id}, moving on...`)
        debugLog(error.message)
        this.writeLogFile(error.message).catch(() => {})
        return ''
      }
    }).join('\n')
  }

  private get zshCompletionSetters(): string {
    const cmdsSetter = this.zshCommandsSetter
    const flagSetters = this.zshCommandsFlagsSetters
    return `${cmdsSetter}\n${flagSetters}`
  }

  private get zshCommandsSetter(): string {
    const cmdsWithDescriptions = this.commands.map(c => {
      try {
        return this.genCmdWithDescription(c)
      } catch (error: any) {
        debugLog(`Error creating zsh autocomplete for command ${c.id}, moving on...`)
        debugLog(error.message)
        this.writeLogFile(error.message).catch(() => {})
        return ''
      }
    })

    return this.genZshAllCmdsListSetter(cmdsWithDescriptions)
  }

  private get zshCommandsFlagsSetters(): string {
    return this.commands.map(c => {
      try {
        return this.genZshCmdFlagsSetter(c)
      } catch (error: any) {
        debugLog(`Error creating zsh autocomplete for command ${c.id}, moving on...`)
        debugLog(error.message)
        this.writeLogFile(error.message).catch(() => {})
        return ''
      }
    }).join('\n')
  }

  private genCmdPublicFlags(command: Command.Loadable): string {
    const Flags = command.flags || {}
    return Object.keys(Flags)
      .filter(flag => !Flags[flag].hidden)
      .map(flag => `--${flag}`)
      .join(' ')
  }

  private genCmdWithDescription(command: Command.Loadable): string {
    let description = ''
    if (command.description) {
      const text = command.description.split('\n')[0]
      description = `:"${text}"`
    }

    return `"${command.id.replace(/:/g, '\\:')}"${description}`
  }

  private genZshCmdFlagsSetter(command: Command.Loadable): string {
    const {id, flags: commandFlags = {}} = command
    const flagscompletions = Object.keys(commandFlags)
      .filter(flag => !commandFlags[flag].hidden)
      .map(flag => {
        const f = commandFlags[flag] || {description: ''}
        const isBoolean = f.type === 'boolean'
        const hasCompletion = 'completion' in f || this.findCompletion(id, flag, f.description)
        const name = isBoolean ? flag : `${flag}=-`
        let cachecompl = ''
        if (hasCompletion) {
          cachecompl = ': :_compadd_flag_options'
        }

        if (this.wantsLocalFiles(flag)) {
          cachecompl = ': :_files'
        }

        const help = isBoolean ? '(switch) ' : (hasCompletion ? '(autocomplete) ' : '')
        const completion = `--${name}[${help}${f.description}]${cachecompl}`
        return `"${completion}"`
      })
      .join('\n')

    if (flagscompletions) {
      return `_set_${id.replace(/:/g, '_')}_flags () {
_flags=(
${flagscompletions}
)
}
`
    }

    return `# no flags for ${id}`
  }

  private genZshAllCmdsListSetter(cmdsWithDesc: Array<string>): string {
    return `
_set_all_commands_list () {
_all_commands_list=(
${cmdsWithDesc.join('\n')}
)
}
`
  }

  private get envAnalyticsDir(): string {
    // Match test expectation: ${cacheDir}/autocomplete/completion_analytics
    return `HEROKU_AC_ANALYTICS_DIR=${this.config.cacheDir}/autocomplete/completion_analytics;`
  }

  private get envCommandsPath(): string {
    // Match test expectation: ${cacheDir}/autocomplete/commands
    return `HEROKU_AC_COMMANDS_PATH=${this.config.cacheDir}/autocomplete/commands;`
  }

  private get bashSetupScript(): string {
    // Match test expectation: ${AC_LIB_PATH}/bash/heroku.bash
    return `${this.envAnalyticsDir}
${this.envCommandsPath}
HEROKU_AC_BASH_COMPFUNC_PATH=${AC_LIB_PATH}/bash/heroku.bash && test -f $HEROKU_AC_BASH_COMPFUNC_PATH && source $HEROKU_AC_BASH_COMPFUNC_PATH;
`
  }

  private get zshSetupScript(): string {
    // Match test expectation: ${AC_LIB_PATH}/zsh
    return `${this.skipEllipsis ? '' : this.completionDotsFunc}
${this.envAnalyticsDir}
${this.envCommandsPath}
HEROKU_AC_ZSH_SETTERS_PATH=\${HEROKU_AC_COMMANDS_PATH}_setters && test -f $HEROKU_AC_ZSH_SETTERS_PATH && source $HEROKU_AC_ZSH_SETTERS_PATH;
fpath=(
${AC_LIB_PATH}/zsh
$fpath
);
autoload -Uz compinit;
compinit;
`
  }

  private get completionDotsFunc(): string {
    return `expand-or-complete-with-dots() {
  echo -n "..."
  zle expand-or-complete
  zle redisplay
}
zle -N expand-or-complete-with-dots
bindkey "^I" expand-or-complete-with-dots`
  }

  private wantsLocalFiles(flag: string): boolean {
    return [
      'file',
      'procfile',
    ].includes(flag)
  }
}
