import {flags} from '@heroku-cli/command'
import {Interfaces} from '@oclif/core'
import * as path from 'path'

import {AutocompleteBase} from '../../base'
import {fetchCache} from '../../cache'

export default class Options extends AutocompleteBase {
  static hidden = true

  static description = 'display arg or flag completion options (used internally by completion functions)'

  static flags = {
    app: flags.app({required: false, hidden: true}),
  }

  static args = [
    {name: 'completion', strict: false},
  ]

  parsedArgs: { [name: string]: string } = {}

  parsedFlags: { [name: string]: string } = {}

  // helpful dictionary
  //
  // *args: refers to a Command's static args
  // *argv: refers to the current execution's command line positional input
  // Klass: (class) Command class
  // completion: (object) object with data/methods to build/retrive options from cache
  // curPosition*: the current argv position the shell is trying to complete
  // options: (string) white-space seperated list of values for the shell to use for completion

  async run() {
    this.errorIfWindows()

    // ex: heroku autocomplete:options 'heroku addons:destroy -a myapp myaddon'
    try {
      const commandStateVars = await this.processCommandLine()
      const completion = this.determineCompletion(commandStateVars)
      const options = await this.fetchOptions(completion)
      if (options) this.log(options)
    } catch (error: any) {
      // write to ac log
      this.writeLogFile(error.message)
    }
  }

  private async processCommandLine() {
    // find command id
    const commandLineToComplete = this.argv[0].split(' ')
    const id = commandLineToComplete[1]
    // find Command
    const C = this.config.findCommand(id)
    let Klass
    if (C) {
      Klass = await C.load()
      // process Command state from command line data
      const slicedArgv = commandLineToComplete.slice(2)
      const [argsIndex, curPositionIsFlag, curPositionIsFlagValue] = this.determineCmdState(slicedArgv, Klass)
      return {id, Klass, argsIndex, curPositionIsFlag, curPositionIsFlagValue, slicedArgv}
    }

    this.throwError(`Command ${id} not found`)
  }

  private determineCompletion(commandStateVars: any) {
    const {id, Klass, argsIndex, curPositionIsFlag, curPositionIsFlagValue, slicedArgv} = commandStateVars
    // setup empty cache completion vars to assign
    let cacheKey: any
    let cacheCompletion: any

    // completing a flag/value? else completing an arg
    if (curPositionIsFlag || curPositionIsFlagValue) {
      const slicedArgvCount = slicedArgv.length
      const lastArgvArg = slicedArgv[slicedArgvCount - 1]
      const previousArgvArg = slicedArgv[slicedArgvCount - 2]
      const argvFlag = curPositionIsFlagValue ? previousArgvArg : lastArgvArg
      const {name, flag} = this.findFlagFromWildArg(argvFlag, Klass)
      if (!flag) this.throwError(`${argvFlag} is not a valid flag for ${id}`)
      cacheKey = name || flag.name
      cacheCompletion = flag.completion
    } else {
      const cmdArgs = Klass.args || []
      // variable arg (strict: false)
      if (!Klass.strict) {
        cacheKey = cmdArgs[0] && cmdArgs[0].name.toLowerCase()
        cacheCompletion = this.findCompletion(cacheKey, id)
        if (!cacheCompletion) this.throwError(`Cannot complete variable arg position for ${id}`)
      } else if (argsIndex > cmdArgs.length - 1) {
        this.throwError(`Cannot complete arg position ${argsIndex} for ${id}`)
      } else {
        const arg = cmdArgs[argsIndex]
        cacheKey = arg.name.toLowerCase()
      }
    }

    // try to auto-populate the completion object
    if (!cacheCompletion) {
      cacheCompletion = this.findCompletion(cacheKey, id)
    }

    return {cacheKey, cacheCompletion}
  }

  private async fetchOptions(cache: any) {
    const {cacheCompletion, cacheKey} = cache
    const flags = await this.parsedFlagsWithEnvVars()

    // build/retrieve & return options cache
    if (cacheCompletion && cacheCompletion.options) {
      const ctx = {
        args: this.parsedArgs,
        // special case for app & team env vars
        flags,
        argv: this.argv,
        config: this.config,
      }
      // use cacheKey function or fallback to arg/flag name
      const ckey = cacheCompletion.cacheKey ? await cacheCompletion.cacheKey(ctx) : null
      const key: string = ckey || cacheKey || 'unknown_key_error'
      const flagCachePath = path.join(this.completionsCacheDir, key)

      // build/retrieve cache
      const duration = cacheCompletion.cacheDuration || 60 * 60 * 24 // 1 day
      const opts = {cacheFn: () => cacheCompletion.options(ctx)}
      const options = await fetchCache(flagCachePath, duration, opts)

      // return options cache
      return (options || []).join('\n')
    }
  }

  private async parsedFlagsWithEnvVars() {
    const {flags} = await this.parse(Options)
    return {
      app: process.env.HEROKU_APP || flags.app,
      team: process.env.HEROKU_TEAM || process.env.HEROKU_ORG,
      ...this.parsedFlags,
    }
  }

  private throwError(msg: string) {
    throw new Error(msg)
  }

  private findFlagFromWildArg(wild: string, Klass: Interfaces.Command.Class): { flag: any; name: any } {
    let name = wild.replace(/^-+/, '')
    name = name.replace(/[=](.+)?$/, '')

    const unknown = {flag: undefined, name: undefined}
    if (!Klass.flags) return unknown
    const CFlags = Klass.flags

    let flag = CFlags[name]
    if (flag) return {name, flag}

    name = Object.keys(CFlags).find((k: string) => CFlags[k].char === name) || 'undefinedcommand'
    flag = CFlags && CFlags[name]
    if (flag) return {name, flag}
    return unknown
  }

  private determineCmdState(argv: string[], Klass: Interfaces.Command.Class): [number, boolean, boolean] {
    const Args = Klass.args || []
    let needFlagValueSatisfied = false
    let argIsFlag = false
    let argIsFlagValue = false
    let argsIndex = -1
    let flagName: string

    argv.filter(wild => {
      if (wild.match(/^-(-)?/)) {
        // we're a flag
        argIsFlag = true

        // ignore me
        const wildSplit = wild.split('=')
        const key = wildSplit.length === 1 ? wild : wildSplit[0]
        const {name, flag} = this.findFlagFromWildArg(key, Klass)
        flagName = name
        // end ignore me

        if (wildSplit.length === 1) {
          // we're a flag w/o a '=value'
          // (find flag & see if flag needs a value)
          if (flag && flag.type !== 'boolean') {
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
      argsIndex += 1
      if (argsIndex < Args.length) {
        this.parsedArgs[Args[argsIndex].name] = wild
      }

      argIsFlagValue = false
      needFlagValueSatisfied = false
      return true
    })

    return [argsIndex, argIsFlag, argIsFlagValue]
  }
}
