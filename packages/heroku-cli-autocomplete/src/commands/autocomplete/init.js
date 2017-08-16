// @flow

import path from 'path'
import {logToFile} from 'cli-engine-command/lib/output/stream'
import moment from 'moment'
import Command from 'cli-engine-command'
import fs from 'fs-extra'
import Plugins from 'cli-engine/lib/plugins'
import {convertFromV5} from 'cli-engine/lib/plugins/legacy'

export default class AutocompleteInit extends Command {
  static topic = 'autocomplete'
  static command = 'init'
  static hidden = true

  compaddArgs: Array<string> = []
  compaddFlags: Array<string> = []
  argsSetterFns: Array<string> = []
  flagsSetterFns: Array<string> = []
  cmdsWithDesc: Array<string> = []
  cmdsWithFlags: Array<string> = []

  get completionsCachePath (): string {
    return path.join(this.config.cacheDir, 'completions')
  }

  get acLogfile (): string {
    return path.join(this.config.cacheDir, 'autocomplete.log')
  }

  writeLogFile (msg: string) {
    logToFile(`[${moment().format()}] ${msg}`, this.acLogfile)
  }

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
            this._addArgsSetterFn(this._genCmdArgSetter(cmd, namespace))
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
      this._writeFunctionsToCache()
    } catch (e) {
      this.out.debug('Error creating zsh autocomplete functions cache')
      this.out.debug(e.message)
      this.writeLogFile(e.message)
    }
  }

  _addArgsSetterFn (fn: ?string) {
    if (fn) this.argsSetterFns.push(fn)
  }

  _addFlagsSetterFn (fn: ?string) {
    if (fn) this.flagsSetterFns.push(fn)
  }

  _addCmdWithDesc (cmd: ?string) {
    if (cmd) this.cmdsWithDesc.push(cmd)
  }

  _addCompaddArg (arg: string) {
    if (this.compaddArgs.find(a => a === arg)) return
    this.compaddArgs.push(arg)
  }

  _addCompaddFlag (flag: string) {
    if (this.compaddFlags.find(f => f === flag)) return
    this.compaddFlags.push(flag)
  }

  _genCmdArgSetter (Command: Class<Command<*>>, namespace: string): ?string {
    const id = this._genCmdID(Command, namespace)
    const argscompletions = (Command.args || [])
      .map(arg => { if (arg.completion && !arg.hidden) return arg })
      .filter(arg => arg)
      .map((arg, i) => {
        // make flow happy here
        // even though arg exists
        const name = arg ? arg.name : ''
        const optionalPosition = i === 0 ? '$1' : ''
        const optionalColon = (arg && arg.required) ? '' : ':'
        this._addCompaddArg(name)
        return `"${optionalPosition}${optionalColon}: :_compadd_arg_${name}"`
      })
      .join('\n')

    if (argscompletions) {
      return `_set_${id.replace(/:/g, '_')}_args () {
_args=(${argscompletions})
}
`
    }
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
          this._addCompaddFlag(flag)
          cachecompl = `: :_compadd_flag_${flag}`
        }
        let completion = `--${name}[${f.parse ? '' : '(bool) '}${f.description}]${cachecompl || ''}`
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

  _genCompaddArgs (): Array<string> {
    const args = this.compaddArgs
    return args.map(arg => {
      return `_compadd_arg_${arg} () {
compadd $(echo $(${this.config.bin} autocomplete:values --cmd=$_command_id --resource=${arg} --arg))
}`
    })
  }

  _genCompaddFlags (): Array<string> {
    const flags = this.compaddFlags
    return flags.map(flag => {
      return `_compadd_flag_${flag} () {
compadd $(echo $(${this.config.bin} autocomplete:values --cmd=$_command_id --resource=${flag}))
}`
    })
  }

  _writeShellSetupsToCache () {
    const zshSetup = `HEROKU_AC_COMMANDS_PATH=${path.join(this.completionsCachePath, 'commands')};
HEROKU_ZSH_AC_SETTERS_PATH=\${HEROKU_AC_COMMANDS_PATH}_functions && test -f $HEROKU_ZSH_AC_SETTERS_PATH && source $HEROKU_ZSH_AC_SETTERS_PATH;
fpath=(
${path.join(__dirname, '..', '..', '..', 'autocomplete', 'zsh')}
$fpath
);
autoload -Uz compinit;
compinit;
`
    const bashSetup = `HEROKU_AC_COMMANDS_PATH=${path.join(this.completionsCachePath, 'commands')};
HEROKU_BASH_AC_PATH=${path.join(__dirname, '..', '..', '..', 'autocomplete', 'bash', 'heroku.bash')}
test -f $HEROKU_BASH_AC_PATH && source $HEROKU_BASH_AC_PATH;
`
    fs.writeFileSync(path.join(this.completionsCachePath, 'zsh_setup'), zshSetup)
    fs.writeFileSync(path.join(this.completionsCachePath, 'bash_setup'), bashSetup)
  }

  _writeFunctionsToCache () {
    const completions = []
      .concat(this.argsSetterFns)
      .concat(this.flagsSetterFns)
      .concat(this._genAllCmdsListSetter())
      .concat(this._genCompaddArgs())
      .concat(this._genCompaddFlags())
      .join('\n')
    fs.writeFileSync(path.join(this.completionsCachePath, 'commands_functions'), completions)
  }
}
