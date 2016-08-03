'use strict'

class Context {
  constructor (options) {
    let command = options.command
    let expectedArgs = command.args.slice(0)
    let argv = options.argv.slice(0)
    this.args = {}
    while (argv.length) {
      let arg = argv.shift()
      let expected = expectedArgs.shift()
      if (!expected) throw new Error(`Unexpected argument ${arg}`)
      this.args[expected.name] = arg
    }

    let missingArg = expectedArgs.find(a => a.optional !== true && a.required !== false)
    if (missingArg) {
      throw new Error(`Missing argument ${missingArg.name}`)
    }
  }
}

module.exports = Context
