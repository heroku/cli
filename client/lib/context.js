'use strict'

const builtInFlags = [
  {name: 'debug', char: 'd'}
]

class Context {
  constructor (options) {
    this._argv = options.argv.slice(0)
    this._command = options.command
    this._parseArgs()
    this._prune()
  }

  get _args () {
    if (!this.__args) {
      this.__args = (this._command.args || []).slice(0)
    }
    return this.__args
  }

  get _flags () {
    return this._command.flags || []
  }

  _parseArgs () {
    let parsingFlags = true
    this.flags = {}
    this.args = {}
    while (this._argv.length) {
      let arg = this._argv.shift()
      if (parsingFlags && arg.startsWith('-')) {
        if (arg === '--') { parsingFlags = false; continue }
        if (this._parseFlag(arg)) continue
      }
      let expected = this._args.shift()
      if (!expected) throw new Error(`Unexpected argument ${arg}`)
      this.args[expected.name] = arg
    }

    let missingArg = this._args.find(a => a.optional !== true && a.required !== false)
    if (missingArg) throw new Error(`Missing required argument ${missingArg.name}`)

    let missingFlag = this._flags.find(a => a.optional === false || a.required === true)
    if (missingFlag) throw new Error(`Missing required flag --${missingFlag.name}`)
  }

  _parseFlag (arg) {
    let long = arg.startsWith('--')
    let flag = long ? this._findLongFlag(arg) : this._findShortFlag(arg)
    if (!flag) return false
    let cur = this.flags[flag.name]
    if (flag.hasValue) {
      if (cur) throw new Error(`Flag --${flag.name} already provided`)
      let val = (long || arg.length < 3) ? this._argv.shift() : arg.slice(2)
      if (!val) throw new Error(`Flag --${flag.name} expects a value.`)
      this.flags[flag.name] = val
    } else {
      // if flag is specified multiple times, increment
      if (!cur) this.flags[flag.name] = 0
      this.flags[flag.name]++

      // push the rest of the short characters back on the stack
      if (!long && arg.length > 2) this._argv.unshift(`-${arg.slice(2)}`)
    }
    return true
  }

  _findLongFlag (arg) {
    let find = arr => arr.find(f => f.name === arg.slice(2))
    return find(this._flags) || find(builtInFlags)
  }

  _findShortFlag (arg) {
    let find = arr => arr.find(f => f.char === arg[1])
    return find(this._flags) || find(builtInFlags)
  }

  _prune () {
    delete this._argv
    delete this._command
  }
}

module.exports = Context
