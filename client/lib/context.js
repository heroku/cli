'use strict'

class Context {
  constructor (options) {
    this._argv = options.argv.slice(0)
    this._command = options.command
    this._parseArgs()
    delete this._argv
    delete this._command
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
    let flags = this._command.flags || []
    let flag
    let long = arg.startsWith('--')
    if (long) {
      flag = flags.find(f => f.name === arg.slice(2))
    } else {
      flag = flags.find(f => f.char === arg[1])
    }
    if (!flag) return false
    let cur = this.flags[flag.name]
    if (flag.hasValue) {
      if (cur) throw new Error(`Flag --${flag.name} already provided`)
      let val = (long || arg.length < 3) ? this._argv.shift() : arg.slice(2)
      if (!val) throw new Error(`Flag --${flag.name} expects a value.`)
      this.flags[flag.name] = val
    } else {
      // if flag is specified multiple times, turn it into a number to increment
      if (cur > 1) this.flags[flag.name]++
      else if (cur === true) this.flags[flag.name] = 2
      else this.flags[flag.name] = true

      // push the rest of the short characters back on the stack
      if (!long && arg.length > 2) this._argv.unshift(`-${arg.slice(2)}`)
    }
    return true
  }
}

module.exports = Context
