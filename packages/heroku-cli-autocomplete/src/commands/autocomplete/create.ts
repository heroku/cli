import {Command} from '@oclif/config'
import * as fs from 'fs-extra'
import * as path from 'path'

import {AutocompleteBase} from '../../base'

const debug = require('debug')('autocomplete:create')

export default class Create extends AutocompleteBase {
  static hidden = true
  static description = 'create autocomplete setup scripts and completion functions'

  async run() {
    this.errorIfWindows()
    // 1. ensure needed dirs
    await this.ensureDirs()
    // 2. generate and save autocomplete files
    await this.createFiles()
  }

  private async ensureDirs() {
    // ensure autocomplete cache dir
    await fs.ensureDir(this.autocompleteCacheDir)
    // ensure autocomplete completions dir
    await fs.ensureDir(this.completionsCacheDir)
  }

  private async createFiles() {
    // 1. generate paths and files as strings to write
    const bashSetupScript = this.genBashSetupScript
    const bashSetupScriptPath = path.join(this.autocompleteCacheDir, 'bash_setup')

    const zshSetupScript = this.genZshSetupScript
    const zshSetupScriptPath = path.join(this.autocompleteCacheDir, 'zsh_setup')

    const {bashCmdsWithFlags, zshSetters} = this.genFileStrings
    const bashCommandsListPath = path.join(this.autocompleteCacheDir, 'commands')

    const zshSetupSettersPath = path.join(this.autocompleteCacheDir, 'commands_setters')

    // 2. save files
    await fs.writeFile(bashSetupScriptPath, bashSetupScript)
    await fs.writeFile(zshSetupScriptPath, zshSetupScript)
    await fs.writeFile(bashCommandsListPath, bashCmdsWithFlags)
    await fs.writeFile(zshSetupSettersPath, zshSetters)
  }

  private get skipEllipsis(): boolean {
    return process.env.HEROKU_AC_ZSH_SKIP_ELLIPSIS === '1'
  }

  private get genFileStrings(): {[property: string]: string} {
    // bash
    let cmdsWithFlags: string[] = []
    // zsh
    let cmdFlagsSetters: string[] = []
    let cmdsWithDesc: string[] = []

    this.config.plugins.map(p => {
      p.commands.map(c => {
        try {
          if (c.hidden) return

          const id = this.genCmdID(c)
          const publicFlags = this.genCmdPublicFlags(c).trim()

          cmdsWithFlags.push(`${id} ${publicFlags}`)
          cmdFlagsSetters.push(this.genZshCmdFlagsSetter(c))
          cmdsWithDesc.push(this.genCmdWithDescription(c))
        } catch (err) {
          debug(`Error creating autocomplete for command in ${this.genCmdID(c)}, moving on...`)
          debug(err.message)
          this.writeLogFile(err.message)
        }
      })
    })

    const cmdsSetter = this.genZshAllCmdsListSetter(cmdsWithDesc)
    const flagSetters = cmdFlagsSetters.join('\n')
    const bashCmdsWithFlags = cmdsWithFlags.join('\n')
    const zshSetters = `${cmdsSetter}\n${flagSetters}`

    return {bashCmdsWithFlags, zshSetters}
  }

  private genCmdID(Command: Command): string {
    return Command.id || 'commandIdUndefined'
  }

  private genCmdPublicFlags(Command: Command): string {
    let Flags = Command.flags || {}
    return Object.keys(Flags)
      .filter(flag => !Flags[flag].hidden)
      .map(flag => `--${flag}`)
      .join(' ')
  }

  private genCmdWithDescription(Command: Command): string {
    let description = ''
    if (Command.description) {
      let text = Command.description.split('\n')[0]
      description = `:"${text}"`
    }
    return `"${this.genCmdID(Command).replace(/:/g, '\\:')}"${description}`
  }

  private genZshCmdFlagsSetter(Command: Command): string {
    const id = this.genCmdID(Command)
    const flagscompletions = Object.keys(Command.flags || {})
      .filter(flag => Command.flags && !Command.flags[flag].hidden)
      .map(flag => {
        const f = (Command.flags && Command.flags[flag]) || {description: ''}
        const isBoolean = f.type === 'boolean'
        const hasCompletion = f.hasOwnProperty('completion') || this.findCompletion(flag, id)
        const name = isBoolean ? flag : `${flag}=-`
        let cachecompl = ''
        if (hasCompletion) {
          cachecompl = this.wantsLocalFiles(flag) ? ':_files' : ': :_compadd_flag_options'
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

  private get genBashSetupScript(): string {
    return `${this.envAnalyticsDir}
${this.envCommandsPath}
HEROKU_AC_BASH_COMPFUNC_PATH=${path.join(
      __dirname,
      '..',
      '..',
      '..',
      'autocomplete',
      'bash',
      'cli_engine.bash',
    )} && test -f $HEROKU_AC_BASH_COMPFUNC_PATH && source $HEROKU_AC_BASH_COMPFUNC_PATH;
`
  }

  private get genZshSetupScript(): string {
    return `${this.skipEllipsis ? '' : this.genCompletionDotsFunc()}
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

  private genCompletionDotsFunc(): string {
    return `expand-or-complete-with-dots() {
  echo -n "..."
  zle expand-or-complete
  zle redisplay
}
zle -N expand-or-complete-with-dots
bindkey "^I" expand-or-complete-with-dots`
  }

  private wantsLocalFiles(flag: string) {
    [
      'file',
      'procfile'
    ].includes(flag)
  }
}
