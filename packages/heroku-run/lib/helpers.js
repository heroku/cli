'use strict'

const cli = require('heroku-cli-util')
const shellwords = require('shellwords')

function buildCommand (args) {
  if (args.length === 1) {
    // do not add quotes around arguments if there is only one argument
    // `heroku run "rake test"` should work like `heroku run rake test`
    return args[0]
  }
  return args.map(shellwords.escape).join(' ')
}

function buildEnvFromFlag (flag) {
  let env = {}
  for (let v of flag.split(';')) {
    let m = v.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/)
    if (m) env[m[1]] = m[2]
    else cli.warn(`env flag ${v} appears invalid. Avoid using ';' in values.`)
  }
  return env
}

module.exports = {
  buildCommand,
  buildEnvFromFlag
}
