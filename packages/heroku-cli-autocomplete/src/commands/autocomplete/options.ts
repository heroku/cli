import { ICommand } from '@cli-engine/config'
import { CommandManager } from '@cli-engine/engine/lib/command'
import { Config } from '@cli-engine/engine/lib/config'
import { Plugins } from '@cli-engine/engine/lib/plugins'
import { flags as Flags } from '@heroku-cli/command'
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

  parsedArgs: { [name: string]: string } = {}
  parsedFlags: { [name: string]: string } = {}

  // helpful dictionary
  //
  // *args: refers to a Command's static args
  // *argv: refers to the current execution's command line positional input
  // Command: (class) Command class
  // completion: (object) object with data/methods to build/retrive options from cache
  // curPosition*: the current argv position the shell is trying to complete
  // options: (string) white-space seperated list of values for the shell to use for completion

  async run() {
    // ex: heroku autocomplete:options 'heroku addons:destroy -a myapp myaddon'
    try {
      const commandStateVars = await this.processCommandLine()
      const completion = this.determineCompletion(commandStateVars)
      const options = await this.fetchOptions(completion)
      if (options) cli.log(options)
    } catch (err) {
      // write to ac log
      this.writeLogFile(err.message)
    }
  }

  private async processCommandLine() {
    // find command id
    const commandLineToComplete = this.argv[0].split(' ')
    const CommandID = commandLineToComplete[1]
    // setup cli-engine Command Manager
    const config = new Config(this.config)
    config.plugins = new Plugins(config)
    const CM = new CommandManager(config)
    const iCmd = await CM.findCommand(CommandID, true)
    // find Command
    const Command = await iCmd.fetchCommand()
    // process Command state from command line data
    const slicedArgv = commandLineToComplete.slice(2)
    const [curPositionIsFlag, curPositionIsFlagValue] = this.determineCmdState(slicedArgv, Command)
    return { CommandID, Command, curPositionIsFlag, curPositionIsFlagValue, slicedArgv }
  }

  private determineCompletion(commandStateVars: any) {
    const { CommandID, Command, curPositionIsFlag, curPositionIsFlagValue, slicedArgv } = commandStateVars
    // setup empty cache completion vars to assign
    let cacheKey: any
    let cacheCompletion: any

    // completing a flag/value? else completing an arg
    if (curPositionIsFlag || curPositionIsFlagValue) {
      const slicedArgvCount = slicedArgv.length
      const lastArgvArg = slicedArgv[slicedArgvCount - 1]
      const previousArgvArg = slicedArgv[slicedArgvCount - 2]
      const argvFlag = curPositionIsFlagValue ? previousArgvArg : lastArgvArg
      let { name, flag } = this.findFlagFromWildArg(argvFlag, Command)
      if (!flag) this.throwError(`${argvFlag} is not a valid flag for ${CommandID}`)
      cacheKey = name || flag.name
      cacheCompletion = flag.completion
    } else {
      const cmdArgs = Command.args || []
      const cmdArgsCount = cmdArgs.length
      const parsedArgsLength = Object.keys(this.parsedArgs).length
      // TO-DO: how to handle variableArgs?
      if (Command.variableArgs) {
        cacheCompletion = this.findCompletion(cacheKey, CommandID)
        if (!cacheCompletion) this.throwError(`Cannot complete variable arg position for ${CommandID}`)
      } else if (parsedArgsLength > cmdArgsCount || !parsedArgsLength) {
        this.throwError(`Cannot complete arg position ${parsedArgsLength - 1} for ${CommandID}`)
      } else {
        const arg = cmdArgs[parsedArgsLength - 1]
        cacheKey = arg.name
      }
    }

    // try to auto-populate the completion object
    if (!cacheCompletion) {
      cacheCompletion = this.findCompletion(cacheKey, CommandID)
    }
    return { cacheKey, cacheCompletion }
  }

  private async fetchOptions(cache: any) {
    const { cacheCompletion, cacheKey } = cache
    // build/retrieve & return options cache
    if (cacheCompletion && cacheCompletion.options) {
      const ctx = {
        args: this.parsedArgs,
        // special case for app & team env vars
        flags: this.parsedFlagsWithEnvVars,
        argv: this.argv,
        config: this.config,
      }
      // use cacheKey function or fallback to arg/flag name
      const ckey = cacheCompletion.cacheKey ? await cacheCompletion.cacheKey(ctx) : null
      const key: string = ckey || cacheKey || 'unknown_key_error'
      const flagCachePath = path.join(this.completionsCachePath, key)

      // build/retrieve cache
      const duration = cacheCompletion.cacheDuration || 60 * 60 * 24 // 1 day
      const opts = { cacheFn: () => cacheCompletion.options(ctx) }
      const options = await ACCache.fetch(flagCachePath, duration, opts)

      // return options cache
      return (options || []).join('\n')
    }
  }

  private get parsedFlagsWithEnvVars() {
    return Object.assign(
      {
        app: process.env.HEROKU_APP || this.flags.app,
        team: process.env.HEROKU_TEAM || process.env.HEROKU_ORG,
      },
      this.parsedFlags,
    )
  }

  private throwError(msg: string) {
    throw new Error(msg)
  }

  // TO-DO: create a return type
  private findFlagFromWildArg(wild: string, Command: ICommand): { flag: any; name: any } {
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

  private determineCmdState(argv: string[], Command: ICommand): [boolean, boolean] {
    let needFlagValueSatisfied = false
    let argIsFlag = false
    let argIsFlagValue = false
    let argsIndex = 0
    let flagName: string

    argv.filter(wild => {
      if (wild.match(/^-(-)?/)) {
        // we're a flag
        argIsFlag = true

        // ignore me
        const wildSplit = wild.split('=')
        const key = wildSplit.length === 1 ? wild : wildSplit[0]
        const { name, flag } = this.findFlagFromWildArg(key, Command)
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
      let CArgs = Command.args || []
      if (argsIndex < CArgs.length) {
        this.parsedArgs[CArgs[argsIndex].name] = wild
        argsIndex += 1
      }

      argIsFlagValue = false
      needFlagValueSatisfied = false
      return true
    })

    return [argIsFlag, argIsFlagValue]
  }
}
