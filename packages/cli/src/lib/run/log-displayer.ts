import {APIClient} from '@heroku-cli/command'
import {CliUx} from '@oclif/core'
import HTTP from 'http-call'
import {URL} from 'url'

import colorize from './colorize'
import liner from './line-transform'

const EventSource = require('@heroku/eventsource')

interface LogDisplayerOptions {
  app: string;
  dyno: string;
  lines?: number;
  tail: boolean;
  source?: string;
}

async function readLogsV1(logplexURL: string) {
  const {response} = await HTTP.stream(logplexURL)
  return new Promise(function (resolve, reject) {
    response.setEncoding('utf8')
    liner.setEncoding('utf8')
    response.pipe(liner)
    liner.on('data', line => CliUx.ux.log(colorize(line)))
    response.on('end', resolve)
    response.on('error', reject)
  })
}

function readLogsV2(logplexURL: string) {
  return new Promise<void>(function (resolve, reject) {
    const u = new URL(logplexURL)
    const isTail = u.searchParams.get('tail') === 'true'
    const userAgent = process.env.HEROKU_DEBUG_USER_AGENT || 'heroku-run'
    const proxy = process.env.https_proxy || process.env.HTTPS_PROXY
    const es = new EventSource(logplexURL, {
      proxy,
      headers: {
        'User-Agent': userAgent,
      },
    })

    es.addEventListener('error', function (err: { status: number; message: any }) {
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
    })

    es.addEventListener('message', function (e: { data: string }) {
      e.data.trim().split(/\n+/).forEach(line => {
        CliUx.ux.log(colorize(line))
      })
    })
  })
}

function readLogs(logplexURL: string) {
  const u = new URL(logplexURL)

  if (u.searchParams.has('srv')) {
    return readLogsV1(logplexURL)
  }

  return readLogsV2(logplexURL)
}

async function logDisplayer(heroku: APIClient, options: LogDisplayerOptions) {
  process.stdout.on('error', err => {
    if (err.code === 'EPIPE') {
      process.exit(0)
    } else {
      CliUx.ux.error(err.stack, {exit: 1})
    }
  })

  const response: { body: { logplex_url: string}} = await heroku.post(`/apps/${options.app}/log-sessions`, {
    body: {
      tail: options.tail,
      dyno: options.dyno,
      source: options.source,
      lines: options.lines,
    },
  })

  return readLogs(response.body.logplex_url)
}

export default logDisplayer
