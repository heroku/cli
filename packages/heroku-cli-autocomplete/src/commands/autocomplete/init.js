// @flow

import path from 'path'
import Command from 'cli-engine-command'
import fs from 'fs-extra'
import Plugins from 'cli-engine/lib/plugins'
import {convertFromV5} from 'cli-engine/lib/plugins/legacy'
import {AutocompleteBase} from '../../autocomplete'

export default class AutocompleteInit extends AutocompleteBase {
  static topic = 'autocomplete'
  static command = 'init'
  static hidden = true

  flagsSetterFns: Array<string> = []
  cmdsWithDesc: Array<string> = []
  cmdsWithFlags: Array<string> = []

  async run () {
    await this.createCaches()
  }

  async createCaches () {
    await fs.ensureDir(this.completionsCachePath)
    await this._createCommandsCache()
    await this._createCommandFuncsCache()
  }

  async _createCommandsCache () {
    try {
      const plugins = await new Plugins(this.out).list()
      await Promise.all(plugins.map(async (p) => {
        const hydrated = await p.pluginPath.require()
        const cmds = hydrated.commands || []
        return cmds.map(c => {
          try {
            if (c.hidden || !c.topic) return
            const Command = typeof c === 'function' ? c : convertFromV5((c: any))
            const publicFlags = Object.keys(Command.flags || {}).filter(flag => !Command.flags[flag].hidden).map(flag => `--${flag}`).join(' ')
            const flags = publicFlags.length ? ` ${publicFlags}` : ''
            const namespace = p.namespace ? `${p.namespace}:` : ''
            const id = Command.command ? `${Command.topic}:${Command.command}` : Command.topic
            this.cmdsWithFlags.push(`${namespace}${id}${flags}`)
          } catch (err) {
            this.out.debug(`Error creating autocomplete a command in ${p.name}, moving on...`)
            this.out.debug(err.message)
            this.writeLogFile(err.message)
          }
        })
      }))
      const commands = this.cmdsWithFlags.join('\n')
      fs.writeFileSync(path.join(this.completionsCachePath, 'commands'), commands)
    } catch (e) {
      this.out.debug('Error creating autocomplete commands cache')
      this.out.debug(e.message)
      this.writeLogFile(e.message)
    }
  }

  async _createCommandFuncsCache () {
    try {
      const plugins = await new Plugins(this.out).list()
      // for every plugin
      await Promise.all(plugins.map(async (p) => {
        // re-hydrate
        const hydrated = await p.pluginPath.require()
        const commands = hydrated.commands || []
        // for every command in plugin
        return commands.map(c => {
          try {
            if (c.hidden || !c.topic) return
            // TODO: fix here
            // convertFromV5 pukes here w/o topic
            // but we lose this cmd
            const cmd = typeof c === 'function' ? c : convertFromV5((c: any))
            const namespace = (p.namespace || '')
            // create completion setters
            this._addFlagsSetterFn(this._genCmdFlagSetter(cmd, namespace))
            this._addCmdWithDesc(this._genCmdWithDescription(cmd, namespace))
          } catch (err) {
            this.out.debug(`Error creating azsh autocomplete command in ${p.name}, moving on...`)
            this.out.debug(err.message)
            this.writeLogFile(err.message)
          }
        })
      }))
      // write setups and functions to cache
      this._writeShellSetupsToCache()
      this._writeZshSetterFunctionsToCache()
    } catch (e) {
      this.out.debug('Error creating zsh autocomplete functions cache')
      this.out.debug(e.message)
      this.writeLogFile(e.message)
    }
  }

  _addFlagsSetterFn (fn: ?string) {
    if (fn) this.flagsSetterFns.push(fn)
  }

  _addCmdWithDesc (cmd: ?string) {
    if (cmd) this.cmdsWithDesc.push(cmd)
  }

  _genCmdFlagSetter (Command: Class<Command<*>>, namespace: string): ?string {
    const id = this._genCmdID(Command, namespace)
    const flagscompletions = Object.keys(Command.flags || {})
      .filter(flag => !Command.flags[flag].hidden)
      .map(flag => {
        const f = Command.flags[flag]
        const name = f.parse ? `${flag}=-` : flag
        let cachecompl
        if (f.completion) {
          cachecompl = `: :_compadd_cli`
        }
        let help = f.parse ? (f.completion ? '(autocomplete) ' : '') : '(switch) '
        let completion = `--${name}[${help}${f.description}]${cachecompl || ''}`
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
  }

  _genCmdWithDescription (Command: Class<Command<*>>, namespace: string): string {
    const description = Command.description ? `:"${Command.description}"` : ''
    return `"${this._genCmdID(Command, namespace).replace(/:/g, '\\:')}"${description}`
  }

  // TODO: remove namespace bits
  _genCmdID (Command: Class<Command<*>>, namespace: string): string {
    const ns = namespace ? `${namespace}:` : ''
    const id = Command.command ? `${ns}${Command.topic}:${Command.command}` : `${ns}${Command.topic}`
    return id
  }

  _genAllCmdsListSetter (): string {
    return `
_set_all_commands_list () {
_all_commands_list=(
${this.cmdsWithDesc.join('\n')}
)
}
`
  }

  _writeShellSetupsToCache () {
    const zshSetup = `${this.waitingDots}

HEROKU_AC_ANALYTICS_DIR=${path.join(this.completionsCachePath, 'completion_analytics')};
HEROKU_AC_COMMANDS_PATH=${path.join(this.completionsCachePath, 'commands')};
HEROKU_ZSH_AC_SETTERS_PATH=\${HEROKU_AC_COMMANDS_PATH}_functions && test -f $HEROKU_ZSH_AC_SETTERS_PATH && source $HEROKU_ZSH_AC_SETTERS_PATH;
fpath=(
${path.join(__dirname, '..', '..', '..', 'autocomplete', 'zsh')}
$fpath
);
autoload -Uz compinit;
compinit;
`
    // for now, suspending bash completion
//     const bashSetup = `HEROKU_AC_COMMANDS_PATH=${path.join(this.completionsCachePath, 'commands')};
// HEROKU_BASH_AC_PATH=${path.join(__dirname, '..', '..', '..', 'autocomplete', 'bash', 'heroku.bash')}
// test -f $HEROKU_BASH_AC_PATH && source $HEROKU_BASH_AC_PATH;
// `
    fs.writeFileSync(path.join(this.completionsCachePath, 'zsh_setup'), zshSetup)
    // for now, suspending bash completion
    // fs.writeFileSync(path.join(this.completionsCachePath, 'bash_setup'), bashSetup)
  }

  //   _genCompCli () {
  //     return `_compadd_cli () {
  //   compadd $(echo $(heroku autocomplete:options "\${words}"))
  // }
  // `
  //   }

  get waitingDots (): string {
    return `# http://stackoverflow.com/a/844299
expand-or-complete-with-dots() {
  echo -n "\\e[38;5;104m...\\e[0m"
  zle expand-or-complete
  zle redisplay
}
zle -N expand-or-complete-with-dots
bindkey "^I" expand-or-complete-with-dots`
  }

  _writeZshSetterFunctionsToCache () {
    const completions = []
      .concat(this._genAllCmdsListSetter())
      // .concat(this._genCompCli())
      .concat(this.flagsSetterFns)
      .join('\n')
    fs.writeFileSync(path.join(this.completionsCachePath, 'commands_functions'), completions)
  }
}
