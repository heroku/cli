import {APIClient} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {color} from '@heroku-cli/color'
import colorize from './colorize.js'
import {LogSession} from '../types/fir.js'
import {getGenerationByAppId} from '../apps/generation.js'
import {EventSource} from 'eventsource'
import {HttpsProxyAgent} from 'https-proxy-agent'

interface LogDisplayerOptions {
  app: string,
  dyno?: string
  lines?: number
  source?: string
  tail: boolean
  type?: string
}

export class LogDisplayer {
  private heroku: APIClient
  // private options: LogDisplayerOptions

  constructor(heroku: APIClient) {
    this.heroku = heroku
  }

  async display(options: LogDisplayerOptions): Promise<void> {
    this.setupProcessHandlers()

    const firApp = (await this.getGenerationByAppId(options)) === 'fir'
    const isTail = firApp || options.tail

    const requestBodyParameters = this.buildRequestBodyParameters(firApp, options)

    let recreateLogSession = false
    do {
      const logSession = await this.createLogSession(requestBodyParameters, options.app)

      try {
        await this.readLogs(
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

  private setupProcessHandlers(): void {
    process.stdout.on('error', err => {
      if (err.code === 'EPIPE') {
        // eslint-disable-next-line n/no-process-exit
        process.exit(0)
      } else {
        ux.error(err.stack, {exit: 1})
      }
    })
  }

  private async getGenerationByAppId(options: LogDisplayerOptions): Promise<string> {
    const generation = await getGenerationByAppId(options.app, this.heroku)
    return generation || ''
  }

  private buildRequestBodyParameters(firApp: boolean, options: LogDisplayerOptions): Record<string, any> {
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

    return requestBodyParameters
  }

  private async createLogSession(requestBodyParameters: Record<string, any>, app: string): Promise<LogSession> {
    const {body: logSession} = await this.heroku.post<LogSession>(`/apps/${app}/log-sessions`, {
      body: requestBodyParameters,
      headers: {Accept: 'application/vnd.heroku+json; version=3.sdk'},
    })
    return logSession
  }

  public createEventSourceInstance(url: string, options?: any): EventSource {
    return new EventSource(url, options)
  }

  private readLogs(logplexURL: string, isTail: boolean, recreateSessionTimeout?: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const userAgent = process.env.HEROKU_DEBUG_USER_AGENT || 'heroku-run'
      const proxy = process.env.https_proxy || process.env.HTTPS_PROXY

      // Custom fetch function to handle headers and proxy
      const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers)
        headers.set('User-Agent', userAgent)

        const fetchOptions: RequestInit & { agent?: any } = {
          ...init,
          headers,
        }

        // If proxy is set, use https-proxy-agent
        if (proxy) {
          const proxyAgent = new HttpsProxyAgent(proxy)
          fetchOptions.agent = proxyAgent
        }

        return fetch(input, fetchOptions)
      }

      const es = this.createEventSourceInstance(logplexURL, {
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
}

// Default export for backward compatibility
export default async function logDisplayer(heroku: APIClient, options: LogDisplayerOptions): Promise<void> {
  const displayer = new LogDisplayer(heroku)
  await displayer.display(options)
}
