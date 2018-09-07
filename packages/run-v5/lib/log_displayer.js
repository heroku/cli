'use strict'

let cli = require('heroku-cli-util')
let EventSource = require('@heroku/eventsource')
let url = require('url')
let liner = require('../lib/line_transform')
const colorize = require('./colorize')
const HTTP = require('http-call')

function readLogs (logplexURL) {
  let u = url.parse(logplexURL)
  if (u.query && u.query.includes('srv')) {
    return readLogsV1(logplexURL)
  } else {
    return readLogsV2(logplexURL)
  }
}

async function readLogsV1 (logplexURL) {
  let {response} = await HTTP.stream(logplexURL)
  return new Promise(function (resolve, reject) {
    response.setEncoding('utf8')
    liner.setEncoding('utf8')
    response.pipe(liner)
    liner.on('data', line => cli.log(colorize(line)))
    response.on('end', resolve)
    response.on('error', reject)
  })
}

function readLogsV2 (logplexURL) {
  return new Promise(function (resolve, reject) {
    const u = url.parse(logplexURL, true)
    const isTail = u.query.tail && u.query.tail === 'true'
    const userAgent = process.env.HEROKU_DEBUG_USER_AGENT || 'heroku-run'
    const proxy = process.env.https_proxy || process.env.HTTPS_PROXY
    const es = new EventSource(logplexURL, {
      proxy,
      headers: {
        'User-Agent': userAgent
      }
    })

    es.onerror = function (err) {
      let msg = `${err.status} ${err.message}`

      if (!isTail) {
        if (err) {
          reject(new Error(msg))
        } else {
          resolve()
        }
        es.close()
      }

      if (err) {
        if (err.status === 404 || err.status === 403) {
          msg = 'Log stream timed out. Please try again.'
        }
        reject(new Error(msg))
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
