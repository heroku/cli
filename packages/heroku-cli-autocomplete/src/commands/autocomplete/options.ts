// @flow

import { ICommand } from '@cli-engine/config'
import { CommandManager } from '@cli-engine/engine/lib/command'
import { Config } from '@cli-engine/engine/lib/config'
import { Plugins } from '@cli-engine/engine/lib/plugins'
import { APIClient, flags as Flags } from '@heroku-cli/command'
import { cli } from 'cli-ux'
import * as path from 'path'

import { AutocompleteBase } from '../../autocomplete'
import ACCache from '../../cache'

export default class AutocompleteOptions extends AutocompleteBase {
  static topic = 'autocomplete'
  static command = 'options'
  static description = 'dynamic completion'
  static variableArgs = true
  static hidden = true
  static flags = {
    app: Flags.app({ required: false, hidden: true }),
  }

  beep: string = '\x07'
  parsedArgs: { [name: string]: string } = {}
  parsedFlags: { [name: string]: string } = {}

  async run() {
    // ex: heroku autocomplete:options 'heroku addons:destroy -a myapp myaddon'
    try {
      // A - grab cmd line to complete from argv
      const commandLineToComplete = this.argv[0].split(' ')

      // B - find cmd to complete
      const cmdId = commandLineToComplete[1]
      const config = new Config(this.config)
      config.plugins = new Plugins(config)
      const CM = new CommandManager(config)
      const iCmd = await CM.findCommand(cmdId, true)
      const Command = await iCmd.fetchCommand()

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
      let cacheKey: any
      let cacheCompletion: any

      if (cmdCurArgvIsFlag || cmdCurArgvIsFlagValue) {
        const argvFlag = cmdCurArgvIsFlagValue ? cmdPreviousArgv : cmdCurArgv
        let { name, flag } = this._findFlagFromWildArg(argvFlag, Command)
        if (!flag) throw new Error(`${argvFlag} is not a valid flag for ${cmdId}`)
        cacheKey = name || flag.name
        cacheCompletion = flag.completion
      } else {
        // special config:* completions
        if (cmdId.match(/config:(\w+)et$/)) {
          if (this.flags.app) {
            cacheKey = `${this.flags.app}_config_vars`
            cacheCompletion = {
              cacheDuration: 60 * 60 * 24,
              options: async (ctx: any) => {
                const heroku = new APIClient(ctx.config)
                let { body: configs } = await heroku.get(`/apps/${this.flags.app}/config-vars`)
                return Object.keys(configs)
              },
            }
          } else {
            throw new Error(`No app found for config completion (cmdId: ${cmdId})`)
          }
        } else {
          // for now, suspending arg completion
          throw new Error(`Arg completion disabled (cmdId: ${cmdId})`)
          // const cmdArgs = Command.args || []
          // const cmdArgsCount = cmdArgs.length
          // if (cmdCurArgCount > cmdArgsCount || cmdCurArgCount === 0) throw new Error(`Cannot complete arg position ${cmdCurArgCount} for ${cmdId}`)
          // const arg = cmdArgs[cmdCurArgCount - 1]
          // cacheKey = arg.name
          // cacheCompletion = arg.completion
        }
      }

      // build/retrieve & return options cache
      if (cacheCompletion && cacheCompletion.options) {
        // use cacheKey function or fallback to arg/flag name
        const ctx = { args: this.parsedArgs, flags: this.parsedFlags, argv: this.argv, config: this.config }
        const ckey = cacheCompletion.cacheKey ? await cacheCompletion.cacheKey(ctx) : null
        const key: string = ckey || cacheKey || 'unknown_key_error'
        const flagCachePath = path.join(this.completionsCachePath, key)

        // build/retrieve cache
        const duration = cacheCompletion.cacheDuration || 60 * 60 * 24 // 1 day
        const opts = { cacheFn: () => cacheCompletion.options(ctx) }
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
  _findFlagFromWildArg(wild: string, Command: ICommand): { flag: any; name: any } {
    let name = wild.replace(/^-+/, '')
    name = name.replace(/=(.+)?$/, '')

    let unknown = { flag: undefined, name: undefined }
    if (!Command.flags) return unknown
    const CFlags = Command.flags

    let flag = CFlags[name]
    if (flag) return { name, flag }

    name = Object.keys(CFlags).find((k: string) => CFlags[k].char === name) || 'undefinedcommand'
    flag = CFlags && CFlags[name]
    if (flag) return { name, flag }
    return unknown
  }

  _determineCmdState(argv: Array<string>, Command: ICommand): [boolean, boolean] {
    let needFlagValueSatisfied = false
    let argIsFlag = false
    let argIsFlagValue = false
    let argsIndex = 0
    let flagName: string
    // find cur index of argv (including empty '')
    // that are not flags or flag values

    // for now, suspending arg completion
    argv.filter(wild => {
      // const nthArg = argv.filter(wild => {
      if (wild.match(/^-(-)?/)) {
        // we're a flag
        argIsFlag = true

        // ignore me
        const wildSplit = wild.split('=')
        const key = wildSplit.length === 1 ? wild : wildSplit[0]
        const { name, flag } = this._findFlagFromWildArg(key, Command)
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
      if (argsIndex < (Command.args || []).length) {
        let CArgs = Command.args || []
        this.parsedArgs[CArgs[argsIndex].name] = wild
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
