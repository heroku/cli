import {APIClient} from '@heroku-cli/command'
import * as EventSource from '@heroku/eventsource'
import cli from 'cli-ux'
import HTTP from 'http-call'
import * as url from 'url'

import colorize from './colorize'
import liner from './line-transform'

interface LogDisplayerOptions {
  app: string,
  dyno: string,
  lines?: number
  tail: boolean,
  source?: string
}

function readLogs(logplexURL: string) {
  let u = url.parse(logplexURL)
  if (u.query && u.query.includes('srv')) {
    return readLogsV1(logplexURL)
  } else {
    return readLogsV2(logplexURL)
  }
}

async function readLogsV1(logplexURL: string) {
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

function readLogsV2(logplexURL: string) {
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
      if (err && (err.status || err.message)) {
        const msg = (isTail && (err.status === 404 || err.status === 403)) ?
          'Log stream timed out. Please try again.' :
          `Logs eventsource failed with: ${err.status} ${err.message}`
        reject(msg)
        es.close()
      }

      if (!isTail) {
        resolve()
        es.close()
      }

      // should only land here if --tail and no error status or message
    }

    es.onmessage = function (e) {
      e.data.trim().split(/\n+/).forEach(line => {
        cli.log(colorize(line))
      })
    }
  })
}

async function logDisplayer(heroku: APIClient, options: LogDisplayerOptions) {
  process.stdout.on('error', err => {
    if (err.code === 'EPIPE') {
      process.exit(0)
    } else {
      cli.error(err.stack)
      process.exit(1)
    }
  })

  const response: { body: { logplex_url: string}} = await heroku.post(`/apps/${options.app}/log-sessions`, {
    body: {
      tail: options.tail,
      dyno: options.dyno,
      source: options.source,
      lines: options.lines
    }
  })

  return readLogs(response.body.logplex_url)
}

export default logDisplayer
