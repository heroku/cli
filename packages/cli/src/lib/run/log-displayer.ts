import {APIClient} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import color from '@heroku-cli/color'
import * as https from 'https'
import {URL} from 'url'
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

/**
 * Fetches the response body from an HTTP request when the response body isn't available
 * from the error object (e.g., EventSource doesn't expose response bodies).
 * Uses Node's https module directly (like dyno.ts) to handle staging SSL certificates.
 *
 * @param url - The URL to fetch the response body from
 * @param expectedStatusCode - Only return body if status code matches (default: 403)
 * @returns The response body as a string, or empty string if unavailable or status doesn't match
 */
async function fetchHttpResponseBody(url: string, expectedStatusCode: number = 403): Promise<string> {
  return new Promise(resolve => {
    let req: ReturnType<typeof https.request> | null = null
    let timeout: NodeJS.Timeout | null = null
    const TIMEOUT_MS = 5000 // 5 second timeout

    const cleanup = (): void => {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }

      if (req) {
        req.destroy()
        req = null
      }
    }

    try {
      const parsedUrl = new URL(url)
      const userAgent = process.env.HEROKU_DEBUG_USER_AGENT || 'heroku-run'

      const options: https.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          Accept: 'text/plain',
        },
        rejectUnauthorized: false, // Allow staging self-signed certificates
      }

      req = https.request(options, res => {
        let body = ''
        res.setEncoding('utf8')
        res.on('data', chunk => {
          body += chunk
        })
        res.on('end', () => {
          cleanup()
          if (res.statusCode === expectedStatusCode) {
            resolve(body)
          } else {
            resolve('')
          }
        })
      })

      req.on('error', (): void => {
        cleanup()
        resolve('')
      })

      // Set timeout to prevent hanging requests
      timeout = setTimeout(() => {
        cleanup()
        resolve('')
      }, TIMEOUT_MS)

      req.end()
    } catch {
      cleanup()
      resolve('')
    }
  })
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

    es.addEventListener('error', async function (err: { status?: number; message?: string | null }) {
      if (err && (err.status || err.message)) {
        let msg: string
        if (err.status === 404) {
          msg = 'Your access to the log stream expired. Try again.'
          safeReject(new Error(msg))
        } else if (err.status === 403) {
          // EventSource doesn't expose response bodies, so fetch it via HTTP request
          const responseBody = await fetchHttpResponseBody(logplexURL, 403)

          // Check if response contains IP restriction message
          // Match both "space" (for spaces) and "app" (for apps) IP restriction messages
          if (responseBody && responseBody.includes("can't access") && responseBody.includes('IP address')) {
            // Extract and use the server's error message
            msg = responseBody.trim()
          } else {
            // For other 403 errors (like stream expiration), use default message
            msg = 'Your access to the log stream expired. Try again.'
          }

          safeReject(new Error(msg))
        } else {
          msg = `Logs eventsource failed with: ${err.status}${err.message ? ` ${err.message}` : ''}`

          safeReject(new Error(msg))
        }
      } else if (!isTail) {
        safeResolve()
      }

      // should only land here if --tail and no error status or message
    })

    es.addEventListener('message', function (e: { data: string }) {
      e.data.trim().split(/\n+/).forEach(line => {
        ux.log(colorize(line))
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
