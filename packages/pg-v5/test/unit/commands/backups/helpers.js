'use strict'

let cmdRun = function (name, cmd) {
  return function (args) {
    let varArgs = [name]
    if (cmd.args) {
      cmd.args.forEach(function (arg) {
        if (args.args && args.args[arg.name]) {
          varArgs.push(args.args[arg.name])
        }
      })
    }

    args = Object.assign(args, {args: varArgs})

    const backupsCmd = require('../../../..').commands.find(c => c.topic === 'pg' && c.command === 'backups')
    return backupsCmd.run(args)
  }
}

exports.dup = function (name, cmd) {
  return cmdRun(name, cmd)
}
