'use strict'

const flag = require('./flag')

const builtInFlags = [
  {name: 'debug', char: 'D'},
  {name: 'no-color'}
]

class Context {
  constructor (command) {
    this._command = command
    flag.addHerokuFlags(command)
  }

  * parse (...argv) {
    this._argv = argv.slice(0)
    yield this._parseArgs()
    yield this._before()
    this._prune()
    return this
  }

  get supportsColor () {
    if (['false', '0'].indexOf((process.env.COLOR || '').toLowerCase()) !== -1) return false
    if ((process.env.TERM.toLowerCase() || '') === 'dumb') return false
    if (this.flags['no-color']) return false
    // TODO: check config file
    return true
  }

  get debug () {
    if (this.flags.debug) return this.flags.debug
    if (['true', '1'].indexOf((process.env.HEROKU_DEBUG || '').toLowerCase()) !== -1) return 1
    return 0
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

  * _parseArgs () {
    let parsingFlags = true
    this.flags = {}
    this.args = this._command.variableArgs ? [] : {}
    while (this._argv.length) {
      let arg = this._argv.shift()
      if (parsingFlags && arg.startsWith('-')) {
        if (arg === '--') { parsingFlags = false; continue }
        if (this._parseFlag(arg)) continue
      }
      if (this._command.variableArgs) {
        this.args.push(arg)
      } else {
        let expected = this._args.shift()
        if (!expected) throw new Error(`Unexpected argument ${arg}`)
        this.args[expected.name] = arg
      }
    }

    let missingArg = this._args.find(a => a.optional !== true && a.required !== false)
    if (missingArg) throw new Error(`Missing required argument ${missingArg.name}`)

    yield this._parseFlags()
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

  * _before () {
    for (let filter of this._command.before || []) {
      yield Promise.resolve(filter.bind(this)())
    }
  }

  * _parseFlags () {
    for (let flag of this._flags || []) {
      if (this.flags[flag.name]) {
        if (flag.parse) this.flags[flag.name] = flag.parse.bind(this)(this.flags[flag.name])
      } else {
        if (flag.default) this.flags[flag.name] = yield this._flagDefault(flag)
        if (!this.flags[flag.name] && (flag.optional === false || flag.required === true)) {
          throw new Error(`Missing required flag --${flag.name}`)
        }
      }
    }
  }

  _flagDefault (flag) {
    let val = typeof flag.default === 'function' ? flag.default.bind(this)() : flag.default
    return Promise.resolve(val)
  }

  _prune () {
    delete this._argv
    delete this._command
    delete this.__args
    delete this.__before
  }
}

const {wrap} = require('async-class')
module.exports = wrap(Context)
