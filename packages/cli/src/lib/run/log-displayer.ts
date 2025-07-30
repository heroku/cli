import {APIClient} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {color} from '@heroku-cli/color'
import colorize from './colorize.js'
import {LogSession} from '../types/fir.js'
import {getGenerationByAppId} from '../apps/generation.js'
import {EventSource} from 'eventsource'

interface LogDisplayerOptions {
  app: string,
  dyno?: string
  lines?: number
  source?: string
  tail: boolean
  type?: string
}

function readLogs(logplexURL: string, isTail: boolean, recreateSessionTimeout?: number) {
  return new Promise<void>((resolve, reject) => {
    const userAgent = process.env.HEROKU_DEBUG_USER_AGENT || 'heroku-run'
    const proxy = process.env.https_proxy || process.env.HTTPS_PROXY

    // Custom fetch function to handle headers and proxy
    const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      headers.set('User-Agent', userAgent)

      const fetchOptions: RequestInit = {
        ...init,
        headers,
      }

      // If proxy is set, we need to handle it through environment variables
      // The fetch implementation will automatically use https_proxy/HTTPS_PROXY
      return fetch(input, fetchOptions)
    }

    const es = new EventSource(logplexURL, {
      fetch: customFetch,
    })

    es.addEventListener('error', (err: Event) => {
      // The new eventsource package provides message and code properties on errors
      const errorEvent = err as any
      if (errorEvent && (errorEvent.code || errorEvent.message)) {
        const msg = (isTail && (errorEvent.code === 404 || errorEvent.code === 403))
          ? 'Log stream timed out. Please try again.'
          : `Logs eventsource failed with: ${errorEvent.code}${errorEvent.message ? ` ${errorEvent.message}` : ''}`
        reject(new Error(msg))
        es.close()
      }

      if (!isTail) {
        resolve()
        es.close()
      }

      // should only land here if --tail and no error status or message
    })

    es.addEventListener('message', (e: MessageEvent) => {
      e.data.trim().split(/\n+/).forEach((line: string) => {
        ux.stdout(colorize(line))
      })
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
      // eslint-disable-next-line n/no-process-exit
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
