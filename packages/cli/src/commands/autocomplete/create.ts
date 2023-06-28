import {Interfaces} from '@oclif/core'
import * as fs from 'fs-extra'
import * as path from 'path'

import {AutocompleteBase} from '../../lib/autocomplete/base'

const debug = require('debug')('autocomplete:create')

export default class Create extends AutocompleteBase {
  static hidden = true

  static description = 'create autocomplete setup scripts and completion functions'

  private _commands?: Interfaces.Command[]

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
    return path.join(this.autocompleteCacheDir, 'bash_setup')
  }

  private get bashCommandsListPath(): string {
    // <cacheDir>/autocomplete/commands
    return path.join(this.autocompleteCacheDir, 'commands')
  }

  private get zshSetupScriptPath(): string {
    // <cacheDir>/autocomplete/zsh_setup
    return path.join(this.autocompleteCacheDir, 'zsh_setup')
  }

  private get zshCompletionSettersPath(): string {
    // <cacheDir>/autocomplete/commands_setters
    return path.join(this.autocompleteCacheDir, 'commands_setters')
  }

  private get skipEllipsis(): boolean {
    return process.env.HEROKU_AC_ZSH_SKIP_ELLIPSIS === '1'
  }

  private get commands(): Interfaces.Command[] {
    if (this._commands) return this._commands

    const plugins = this.config.plugins
    const commands: Interfaces.Command[] = []

    plugins.forEach(p => {
      p.commands.forEach(c => {
        if (c.hidden) return
        try {
          commands.push(c)
        } catch (error: any) {
          debug(`Error creating completions for command ${c.id}`)
          debug(error.message)
          this.writeLogFile(error.message)
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
        debug(`Error creating bash completion for command ${c.id}, moving on...`)
        debug(error.message)
        this.writeLogFile(error.message)
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
        debug(`Error creating zsh autocomplete for command ${c.id}, moving on...`)
        debug(error.message)
        this.writeLogFile(error.message)
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
        debug(`Error creating zsh autocomplete for command ${c.id}, moving on...`)
        debug(error.message)
        this.writeLogFile(error.message)
        return ''
      }
    }).join('\n')
  }

  private genCmdPublicFlags(Command: Interfaces.Command): string {
    const Flags = Command.flags || {}
    return Object.keys(Flags)
      .filter(flag => !Flags[flag].hidden)
      .map(flag => `--${flag}`)
      .join(' ')
  }

  private genCmdWithDescription(Command: Interfaces.Command): string {
    let description = ''
    if (Command.description) {
      const text = Command.description.split('\n')[0]
      description = `:"${text}"`
    }

    return `"${Command.id.replace(/:/g, '\\:')}"${description}`
  }

  private genZshCmdFlagsSetter(Command: Interfaces.Command): string {
    const id = Command.id
    const flagscompletions = Object.keys(Command.flags || {})
      .filter(flag => Command.flags && !Command.flags[flag].hidden)
      .map(flag => {
        const f = (Command.flags && Command.flags[flag]) || {description: ''}
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
    return `HEROKU_AC_ANALYTICS_DIR=${path.join(
      this.autocompleteCacheDir,
      'completion_analytics',
    )};`
  }

  private get envCommandsPath(): string {
    return `HEROKU_AC_COMMANDS_PATH=${path.join(this.autocompleteCacheDir, 'commands')};`
  }

  private get bashSetupScript(): string {
    return `${this.envAnalyticsDir}
${this.envCommandsPath}
HEROKU_AC_BASH_COMPFUNC_PATH=${path.join(
    __dirname,
    '..',
    '..',
    '..',
    'autocomplete',
    'bash',
    'heroku.bash',
  )} && test -f $HEROKU_AC_BASH_COMPFUNC_PATH && source $HEROKU_AC_BASH_COMPFUNC_PATH;
`
  }

  private get zshSetupScript(): string {
    return `${this.skipEllipsis ? '' : this.completionDotsFunc}
${this.envAnalyticsDir}
${this.envCommandsPath}
HEROKU_AC_ZSH_SETTERS_PATH=\${HEROKU_AC_COMMANDS_PATH}_setters && test -f $HEROKU_AC_ZSH_SETTERS_PATH && source $HEROKU_AC_ZSH_SETTERS_PATH;
fpath=(
${path.join(__dirname, '..', '..', '..', 'autocomplete', 'zsh')}
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
