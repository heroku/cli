'use strict'

let cli = require('heroku-cli-util')
let liner = require('../lib/line_transform')

const COLORS = [
  s => cli.color.cyan(s),
  s => cli.color.magenta(s),
  s => cli.color.yellow(s),
  s => cli.color.green(s),
  s => cli.color.red(s),
  s => cli.color.blue(s),
  s => cli.color.bold.cyan(s),
  s => cli.color.bold.magenta(s),
  s => cli.color.bold.yellow(s),
  s => cli.color.bold.green(s),
  s => cli.color.bold.red(s),
  s => cli.color.bold.blue(s)
]
let assignedColors = {}
function getColorForIdentifier (i) {
  if (assignedColors[i]) return assignedColors[i]
  assignedColors[i] = COLORS[Object.keys(assignedColors).length % COLORS.length]
  return assignedColors[i]
}

let lineRegex = /^(.*?\[([\w-]+)([\d\.]+)?\]:)(.*)?$/
function colorize (line) {
  let parsed = line.match(lineRegex)
  if (!parsed) return line
  let header = parsed[1]
  let identifier = parsed[2]
  let body = parsed[4]
  return getColorForIdentifier(identifier)(header) + body
}

function readLogs (logplexURL) {
  return new Promise(function (resolve, reject) {
    let res = cli.got.stream(logplexURL)
    res.setEncoding('utf8')
    liner.setEncoding('utf8')
    res.pipe(liner)
    liner.on('data', line => cli.log(colorize(line)))
    res.on('end', resolve)
    res.on('error', reject)
  })
}

function logDisplayer (heroku, options) {
  return heroku.request({
    path: `/apps/${options.app}/log-sessions`,
    method: 'POST',
    body: {
      tail: options.tail,
      dyno: options.dyno,
      source: options.source,
      lines: options.lines
    }
  })
    .then(response => readLogs(response.logplex_url))
}

module.exports = logDisplayer
module.exports.COLORS = COLORS
