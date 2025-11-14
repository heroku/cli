import {APIClient} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import color from '@heroku-cli/color'
import colorize from './colorize'
import {LogSession} from '../types/fir'
import {getGenerationByAppId} from '../apps/generation'

const EventSource = require('@heroku/eventsource')

interface LogDisplayerOptions {
  app: string,
  dyno?: string
  lines?: number
  source?: string
  tail: boolean
  type?: string
}

function readLogs(logplexURL: string, isTail: boolean, recreateSessionTimeout?: number) {
  return new Promise<void>(function (resolve, reject) {
    const userAgent = process.env.HEROKU_DEBUG_USER_AGENT || 'heroku-run'
    const proxy = process.env.https_proxy || process.env.HTTPS_PROXY
    const es = new EventSource(logplexURL, {
      proxy,
      headers: {
        'User-Agent': userAgent,
      },
    })

    let isResolved = false
    let hasReceivedMessages = false

    const safeReject = (error: Error) => {
      if (!isResolved) {
        isResolved = true
        es.close()
        reject(error)
      }
    }

    const safeResolve = () => {
      if (!isResolved) {
        isResolved = true
        es.close()
        resolve()
      }
    }

    es.addEventListener('message', function (e: { data: string }) {
      hasReceivedMessages = true
      e.data.trim().split(/\n+/).forEach(line => {
        ux.log(colorize(line))
      })
    })

    es.addEventListener('error', function (err: { status?: number; message?: string | null }) {
      if (err && (err.status || err.message)) {
        let msg: string
        if (err.status === 403) {
          msg = hasReceivedMessages ?
            'Log stream access expired. Please try again.' :
            "You can't access this space from your IP address. Contact your team admin."
        } else if (err.status === 404 && isTail) {
          msg = 'Log stream access expired. Please try again.'
        } else {
          msg = `Logs eventsource failed with: ${err.status}${err.message ? ` ${err.message}` : ''}`
        }

        safeReject(new Error(msg))
      } else if (!isTail) {
        safeResolve()
      }

      // should only land here if --tail and no error status or message
    })

    if (isTail && recreateSessionTimeout) {
      setTimeout(() => {
        reject(new Error('Fir log stream timeout'))
        es.close()
      }, recreateSessionTimeout)
    }
  })
}

async function logDisplayer(heroku: APIClient, options: LogDisplayerOptions) {
  process.stdout.on('error', err => {
    if (err.code === 'EPIPE') {
      process.exit(0)
    } else {
      ux.error(err.stack, {exit: 1})
    }
  })

  const firApp = (await getGenerationByAppId(options.app, heroku)) === 'fir'
  const isTail = firApp || options.tail

  const requestBodyParameters = {
    source: options.source,
  }

  if (firApp) {
    process.stderr.write(color.cyan.bold('Fetching logs...\n\n'))
    Object.assign(requestBodyParameters, {
      dyno: options.dyno,
      type: options.type,
    })
  } else {
    Object.assign(requestBodyParameters, {
      dyno: options.dyno || options.type,
      lines: options.lines,
      tail: options.tail,
    })
  }

  let recreateLogSession = false
  do {
    const {body: logSession} = await heroku.post<LogSession>(`/apps/${options.app}/log-sessions`, {
      body: requestBodyParameters,
      headers: {Accept: 'application/vnd.heroku+json; version=3.sdk'},
    })

    try {
      await readLogs(
        logSession.logplex_url,
        isTail,
        firApp ? Number(process.env.HEROKU_LOG_STREAM_TIMEOUT || '15') * 60 * 1000 : undefined,
      )
    } catch (error: unknown) {
      const {message} = error as Error
      if (message === 'Fir log stream timeout')
        recreateLogSession = true
      else
        ux.error(message, {exit: 1})
    }
  } while (recreateLogSession)
}

export default logDisplayer
