// @flow

import path from 'path'
import Command from 'cli-engine-command'
import fs from 'fs-extra'
import Plugins from 'cli-engine/lib/plugins'
import {convertFromV5} from '../../legacy'
import {AutocompleteBase} from '../../autocomplete'

const debug = require('debug')('heroku:autocomplete')

type CacheStrings = {
  cmdsWithFlags: string,
  cmdFlagsSetters: string,
  cmdsWithDescSetter: string
}

export default class AutocompleteCacheBuilder extends AutocompleteBase {
  static topic = 'autocomplete'
  static command = 'buildcache'
  static description = 'autocomplete cache builder'
  // hide until public release
  static hidden = true
  static aliases = ['autocomplete:init']

  plugins: Array<Plugins> = []

  async run () {
    await this.createCaches()
  }

  async createCaches () {
    if (this.config.mock) return
    await this.hydratePlugins()
    // 1. ensure completions cache dir
    await fs.ensureDir(this.completionsCachePath)
    // 2. create commands cache strings
    const cacheStrings = this._genCmdsCacheStrings()
    // 3. save bash commands with flags list
    await fs.writeFile(path.join(this.completionsCachePath, 'commands'), cacheStrings.cmdsWithFlags)
    // 4. save zsh command with descriptions list & command-flags setters
    const zshFuncs = `${cacheStrings.cmdsWithDescSetter}\n${cacheStrings.cmdFlagsSetters}`
    await fs.writeFile(path.join(this.completionsCachePath, 'commands_functions'), zshFuncs)
    // 5. save shell setups
    const [bashSetup, zshSetup] = this._genShellSetups(this.skipEllipsis)
    await fs.writeFile(path.join(this.completionsCachePath, 'bash_setup'), bashSetup)
    await fs.writeFile(path.join(this.completionsCachePath, 'zsh_setup'), zshSetup)
  }

  get skipEllipsis (): boolean {
    return process.env.HEROKU_AC_ZSH_SKIP_ELLIPSIS === '1'
  }

  async hydratePlugins () {
    const plugins = await new Plugins(this.config).list()
    this.plugins = await Promise.all(plugins.map(async (p) => {
      const hydrated = await p.pluginPath.require()
      return hydrated
    }))
  }

  _genCmdsCacheStrings (): CacheStrings {
    // bash
    let cmdsWithFlags = []
    // zsh
    let cmdFlagsSetters = []
    let cmdsWithDesc = []
    this.plugins.map(p => {
      return (p.commands || []).map(c => {
        try {
          if (c.hidden || !c.topic) return
          const Command = typeof c === 'function' ? c : convertFromV5((c: any))
          const id = this._genCmdID(Command)
          const publicFlags = this._genCmdPublicFlags(Command)
          cmdsWithFlags.push(`${id} ${publicFlags}`.trim())
          cmdFlagsSetters.push(this._genZshCmdFlagsSetter(Command))
          cmdsWithDesc.push(this._genCmdWithDescription(Command))
        } catch (err) {
          debug(`Error creating autocomplete a command in ${p.name}, moving on...`)
          debug(err.message)
          this.writeLogFile(err.message)
        }
      })
    })
    return {
      cmdsWithFlags: cmdsWithFlags.join('\n'),
      cmdFlagsSetters: cmdFlagsSetters.join('\n'),
      cmdsWithDescSetter: this._genZshAllCmdsListSetter(cmdsWithDesc)
    }
  }

  _genCmdID (Command: Class<Command<*>>): string {
    return Command.command ? `${Command.topic}:${Command.command}` : Command.topic
  }

  _genCmdPublicFlags (Command: Class<Command<*>>): string {
    return Object.keys(Command.flags || {}).filter(flag => !Command.flags[flag].hidden).map(flag => `--${flag}`).join(' ')
  }

  _genCmdWithDescription (Command: Class<Command<*>>): string {
    const description = Command.description ? `:"${Command.description}"` : ''
    return `"${this._genCmdID(Command).replace(/:/g, '\\:')}"${description}`
  }

  _genZshCmdFlagsSetter (Command: Class<Command<*>>): string {
    const id = this._genCmdID(Command)
    const flagscompletions = Object.keys(Command.flags || {})
      .filter(flag => !Command.flags[flag].hidden)
      .map(flag => {
        const f = Command.flags[flag]
        const name = f.parse ? `${flag}=-` : flag
        let cachecompl = ''
        if (f.completion) {
          cachecompl = `: :_compadd_flag_options`
        }
        const help = f.parse ? (f.completion ? '(autocomplete) ' : '') : '(switch) '
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

  _genZshAllCmdsListSetter (cmdsWithDesc: Array<string>): string {
    return `
_set_all_commands_list () {
_all_commands_list=(
${cmdsWithDesc.join('\n')}
)
}
`
  }

  _genShellSetups (skipEllipsis: boolean = false): Array<string> {
    const envAnalyticsDir = `HEROKU_AC_ANALYTICS_DIR=${path.join(this.completionsCachePath, 'completion_analytics')};`
    const envCommandsPath = `HEROKU_AC_COMMANDS_PATH=${path.join(this.completionsCachePath, 'commands')};`
    const zshSetup = `${skipEllipsis ? '' : this._genCompletionDotsFunc()}
${envAnalyticsDir}
${envCommandsPath}
HEROKU_ZSH_AC_SETTERS_PATH=\${HEROKU_AC_COMMANDS_PATH}_functions && test -f $HEROKU_ZSH_AC_SETTERS_PATH && source $HEROKU_ZSH_AC_SETTERS_PATH;
fpath=(
${path.join(__dirname, '..', '..', '..', 'autocomplete', 'zsh')}
$fpath
);
autoload -Uz compinit;
compinit;
`
    const bashSetup = `${envAnalyticsDir}
${envCommandsPath}
HEROKU_BASH_AC_PATH=${path.join(__dirname, '..', '..', '..', 'autocomplete', 'bash', 'heroku.bash')} && test -f $HEROKU_BASH_AC_PATH && source $HEROKU_BASH_AC_PATH;
`
    return [bashSetup, zshSetup]
  }

  _genCompletionDotsFunc (): string {
    return `expand-or-complete-with-dots() {
  echo -n "..."
  zle expand-or-complete
  zle redisplay
}
zle -N expand-or-complete-with-dots
bindkey "^I" expand-or-complete-with-dots`
  }
}
