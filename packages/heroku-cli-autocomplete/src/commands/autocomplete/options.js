// @flow

import type Command from 'cli-engine-command'
import Plugins from 'cli-engine/lib/plugins'
import path from 'path'
import ACCache from '../../cache'
import AutocompleteBase from '.'
import cli from 'cli-ux'

export default class AutocompleteOptions extends AutocompleteBase {
  static topic = 'autocomplete'
  static command = 'options'
  static description = 'dynamic completion'
  static variableArgs = true
  static hidden = true

  beep: string = '\x07'
  parsedArgs: {[name: string]: ?string} = {}
  parsedFlags: {[name: string]: ?string} = {}

  async run () {
    // ex: heroku autocomplete:options 'heroku addons:destroy -a myapp myaddon'
    try {
      // A - grab cmd line to complete from argv
      const commandLineToComplete = this.argv[0].split(' ')

      // B - find cmd to complete
      const cmdId = commandLineToComplete[1]
      const plugins = new Plugins(this.config)
      await plugins.load()
      let Command = await plugins.findCommand(cmdId)
      if (!Command) throw new Error(`Command ${cmdId} not found`)

      // C -
      // 1. find what arg/flag is asking to be completed
      // 2. set any parsable context from exisitng args/flags
      // 3. set vars needed to build/retrive options cache
      const cmdArgv = commandLineToComplete.slice(2)
      const cmdArgvCount = cmdArgv.length
      const cmdCurArgv = cmdArgv[cmdArgvCount - 1]
      const cmdPreviousArgv = cmdArgv[cmdArgvCount - 2]
      // for now, suspending arg completion
      // let [cmdCurArgCount, cmdCurArgvIsFlag, cmdCurArgvIsFlagValue] =
      let [cmdCurArgvIsFlag, cmdCurArgvIsFlagValue] = this._determineCmdState(cmdArgv, Command)
      let cacheKey
      let cacheCompletion

      if (cmdCurArgvIsFlag || cmdCurArgvIsFlagValue) {
        const argvFlag = cmdCurArgvIsFlagValue ? cmdPreviousArgv : cmdCurArgv
        let {name, flag} = this._findFlagFromWildArg(argvFlag, Command)
        if (!flag) throw new Error(`${argvFlag} is not a valid flag for ${cmdId}`)
        cacheKey = name || flag.name
        cacheCompletion = flag.completion
      } else {
        // for now, suspending arg completion
        throw new Error(`${cmdCurArgv} is not a valid flag for ${cmdId}`)
        // const cmdArgs = Command.args || []
        // const cmdArgsCount = cmdArgs.length
        // if (cmdCurArgCount > cmdArgsCount || cmdCurArgCount === 0) throw new Error(`Cannot complete arg position ${cmdCurArgCount} for ${cmdId}`)
        // const arg = cmdArgs[cmdCurArgCount - 1]
        // cacheKey = arg.name
        // cacheCompletion = arg.completion
      }

      // build/retrieve & return options cache
      if (cacheCompletion && cacheCompletion.options) {
        // use cacheKey function or fallback to arg/flag name
        const ctx = {args: this.parsedArgs, flags: this.parsedFlags, argv: this.argv, config: this.config}
        const ckey = cacheCompletion.cacheKey ? await cacheCompletion.cacheKey(ctx) : null
        const key = (ckey || cacheKey)
        const flagCachePath = path.join(this.completionsPath, key)

        // build/retrieve cache
        const duration = cacheCompletion.cacheDuration || 60 * 60 * 24 // 1 day
        const opts = {cacheFn: () => cacheCompletion.options(ctx)}
        const options = await ACCache.fetch(flagCachePath, duration, opts)

        // return options cache
        cli.log((options || []).join('\n'))
      }
    } catch (err) {
      // on error make audible 'beep'
      process.stderr.write('\x07')
      // write to ac log
      this.writeLogFile(err.message)
    }
  }

  // TO-DO: create a return type
  _findFlagFromWildArg (wild: string, Command: Class<Command<*>>): Object {
    let name = wild.replace(/^-+/, '')
    name = name.replace(/=(.+)?$/, '')

    let flag = Command.flags[name]
    if (flag) return {name, flag}

    name = Object.keys(Command.flags).find(k => Command.flags[k].char === name)
    flag = Command.flags[name]
    if (flag) return {name, flag}
    return {}
  }

  _determineCmdState (argv: Array<string>, Command: Class<Command<*>>): [boolean, boolean] {
    let needFlagValueSatisfied = false
    let argIsFlag = false
    let argIsFlagValue = false
    let argsIndex = 0
    let flagName
    // find cur index of argv (including empty '')
    // that are not flags or flag values

    // for now, suspending arg completion
    argv.filter(wild => { // const nthArg = argv.filter(wild => {
      if (wild.match(/^-(-)?/)) {
        // we're a flag
        argIsFlag = true

        // ignore me
        const wildSplit = wild.split('=')
        const key = wildSplit.length === 1 ? wild : wildSplit[0]
        const {name, flag} = this._findFlagFromWildArg(key, Command)
        flagName = name
        // end ignore me

        if (wildSplit.length === 1) {
          // we're a flag w/o a '=value'
          // (find flag & see if flag needs a value)
          if (flag && flag.parse) {
            // we're a flag who needs our value to be next
            argIsFlagValue = false
            needFlagValueSatisfied = true
            return false
          }
        }

        // --app=my-app is consided a flag & not a flag value
        // the shell's autocomplete handles partial value matching

        // add parsedFlag
        if (wildSplit.length === 2 && name) this.parsedFlags[name] = wildSplit[1]

        // we're a flag who is satisfied
        argIsFlagValue = false
        needFlagValueSatisfied = false
        return false
      }

      // we're not a flag
      argIsFlag = false

      if (needFlagValueSatisfied) {
        // we're a flag value

        // add parsedFlag
        if (flagName) this.parsedFlags[flagName] = wild

        argIsFlagValue = true
        needFlagValueSatisfied = false
        return false
      }

      // we're an arg!

      // add parsedArgs
      // TO-DO: how to handle variableArgs?
      if (argsIndex < Command.args.length) {
        this.parsedArgs[Command.args[argsIndex].name] = wild
        argsIndex += 1
      }

      argIsFlagValue = false
      needFlagValueSatisfied = false
      return true
    }) // .length

    // for now, suspending arg completion
    // return [nthArg, argIsFlag, argIsFlagValue]
    return [argIsFlag, argIsFlagValue]
  }
}
