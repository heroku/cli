import {APIClient} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import color from '@heroku-cli/color'
import colorize from './colorize'
import {LogSession} from '../types/fir'
import {getGenerationByAppId} from '../apps/generation'

interface LogDisplayerOptions {
  app: string,
  dyno?: string
  lines?: number
  source?: string
  tail: boolean
  type?: string
}

async function readLogs(logplexURL: string, isTail?:boolean, recreateSessionTimeout?: number) {
  // node 20+ will automatically use HTTP_PROXY/HTTPS_PROXY env variables with fetch
  const response = await fetch(logplexURL, {
    headers: {
      'User-Agent': process.env.HEROKU_DEBUG_USER_AGENT || 'heroku-run',
      Accept: 'text/event-stream',
    },
  })

  if (!response.ok) {
    const msg = (isTail && (response.status === 404 || response.status === 403)) ?
      'Log stream timed out. Please try again.' :
      `Logs stream failed with: ${response.status} ${response.statusText}`
    throw new Error(msg)
  }

  if (!response.body) {
    throw new Error('No response body received')
  }

  const reader = response.body.getReader()

  // logplex sessions seem to timeout after 15 min anyway
  let timeoutId: NodeJS.Timeout | undefined
  if (isTail && recreateSessionTimeout) {
    timeoutId = setTimeout(() => {
      reader.cancel()
      throw new Error('Fir log stream timeout')
    }, recreateSessionTimeout)
  }

  try {
    await beginReading(reader)
  } catch (error) {
    reader.cancel()
    throw error
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

async function beginReading(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
  let buffer = ''
  const decoder = new TextDecoder()
  while (true) {
    const {value, done} = await reader.read()

    if (done) {
      return
    }
    // could also use Buffer.from(value).toString() here
    // but Buffer has a slight disadvantage in performance

    buffer += decoder.decode(value, {stream: true})
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.trim()) {
        // Parse SSE format if the data is in that format

        if (line.match(/^id: (.+)$/)) {
          continue
        }

        const match = line.match(/^data: (.+)$/)
        const data = match ? match[1] : line
        ux.log(colorize(data))
      }
    }
  }
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
