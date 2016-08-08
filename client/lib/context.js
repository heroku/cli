'use strict'

const builtInFlags = {
  debug: {char: 'd'}
}

class Context {
  constructor (options) {
    this._argv = options.argv.slice(0)
    this._command = options.command
    this._parseArgs()
    this._prune()
  }

  get _flags () {
    if (this.__flags) return this.__flags
    this.__flags = this._command.flags || {}
    if (Array.isArray(this.__flags)) {
      // convert from old flag format
      this.__flags = this.__flags.reduce((flags, i) => {
        flags[i.name] = i
        return flags
      }, {})
    }
    return this.__flags
  }

  _parseArgs () {
    let expectedArgs = (this._command.args || []).slice(0)
    let parsingFlags = true
    this.flags = {}
    this.args = {}
    while (this._argv.length) {
      let arg = this._argv.shift()
      if (parsingFlags && arg.startsWith('-')) {
        if (arg === '--') { parsingFlags = false; continue }
        if (this._parseFlag(arg)) continue
      }
      let expected = expectedArgs.shift()
      if (!expected) throw new Error(`Unexpected argument ${arg}`)
      this.args[expected.name] = arg
    }

    let missingArg = expectedArgs.find(a => a.optional !== true && a.required !== false)
    if (missingArg) throw new Error(`Missing argument ${missingArg.name}`)
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
    return this._flags[arg.slice(2)] || builtInFlags[arg.slice(2)]
  }

  _findShortFlag (arg) {
    for (let flag of Object.keys(this._flags)) {
      if (arg[1] === this._flags[flag].char) return this._flags[flag]
    }
    for (let flag of Object.keys(builtInFlags)) {
      if (arg[1] === builtInFlags[flag].char) {
        return Object.assign({name: flag}, builtInFlags[flag])
      }
    }
  }

  _prune () {
    delete this._argv
    delete this._command
    delete this.__flags
  }
}

module.exports = Context
