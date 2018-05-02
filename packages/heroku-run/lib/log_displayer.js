'use strict'

let cli = require('heroku-cli-util')
let EventSource = require('eventsource')
let url = require('url')
let liner = require('../lib/line_transform')

const COLORS = [
  s => cli.color.yellow(s),
  s => cli.color.green(s),
  s => cli.color.cyan(s),
  s => cli.color.magenta(s),
  s => cli.color.blue(s),
  s => cli.color.bold.green(s),
  s => cli.color.bold.cyan(s),
  s => cli.color.bold.magenta(s),
  s => cli.color.bold.yellow(s),
  s => cli.color.bold.blue(s)
]
const assignedColors = {}
function getColorForIdentifier (i) {
  if (assignedColors[i]) return assignedColors[i]
  assignedColors[i] = COLORS[Object.keys(assignedColors).length % COLORS.length]
  return assignedColors[i]
}

// get initial colors so they are the same every time
getColorForIdentifier('run')
getColorForIdentifier('router')
getColorForIdentifier('web')
getColorForIdentifier('postgres')
getColorForIdentifier('heroku-postgres')

let lineRegex = /^(.*?\[([\w-]+)([\d.]+)?]:)(.*)?$/
function colorize (line) {
  let parsed = line.match(lineRegex)
  if (!parsed) return line
  let header = parsed[1]
  let identifier = parsed[2]
  let body = parsed[4]
  return getColorForIdentifier(identifier)(header) + body
}

function readLogs (logplexURL) {
  let u = url.parse(logplexURL)
  if (u.query && u.query.includes('srv')) {
    return readLogsV1(logplexURL)
  } else {
    return readLogsV2(logplexURL)
  }
}

function readLogsV1 (logplexURL) {
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

function readLogsV2 (logplexURL) {
  return new Promise(function (resolve, reject) {
    let u = url.parse(logplexURL, true)
    let isTail = u.query.tail && u.query.tail === 'true'
    let userAgent = process.env.HEROKU_DEBUG_USER_AGENT || 'heroku-run'
    let es = new EventSource(logplexURL, {
      headers: {
        'User-Agent': userAgent
      }
    })

    es.onerror = function (err) {
      if (!isTail) {
        resolve()
        es.close()
      }

      if (err && (err.status === 404 || err.status === 403)) {
        reject(new Error('Log stream timed out. Please try again.'))
        es.close()
      }
    }

    es.onmessage = function (e) {
      e.data.trim().split(/\n+/).forEach((line) => {
        cli.log(colorize(line))
      })
    }
  })
}

async function logDisplayer (heroku, options) {
  process.stdout.on('error', err => {
    if (err.code === 'EPIPE') {
      process.exit(0)
    } else {
      console.error(err.stack)
      process.exit(1)
    }
  })
  const response = await heroku.request({
    path: `/apps/${options.app}/log-sessions`,
    method: 'POST',
    body: {
      tail: options.tail,
      dyno: options.dyno,
      source: options.source,
      lines: options.lines
    }
  })
  return readLogs(response.logplex_url)
}

module.exports = logDisplayer
module.exports.COLORS = COLORS
