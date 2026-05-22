import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {logSessionExtensions} from '@heroku/sdk/extensions/platform'
import {ux} from '@oclif/core/ux'

import colorize from './colorize.js'

export interface LogDisplayerOptions {
  app: string
  dyno?: string
  lines?: number
  source?: string
  tail: boolean
  type?: string
}

// Install once at module load so repeated displayLogs() calls don't
// stack listeners on process.stdout (which would trip Node's
// MaxListeners warning).
process.stdout.on('error', err => {
  if (err.code === 'EPIPE') {
    // eslint-disable-next-line n/no-process-exit, unicorn/no-process-exit
    process.exit(0)
  } else {
    ux.error(err.message ?? String(err), {exit: 1})
  }
})

export async function displayLogs(options: LogDisplayerOptions): Promise<void> {
  const controller = new AbortController()
  const onAbort = () => controller.abort()
  process.once('SIGINT', onAbort)
  process.once('SIGTERM', onAbort)

  const {platform} = new HerokuSDK({extensions: [logSessionExtensions]})

  try {
    for await (const line of platform.logSession.streamLogs(options.app, {
      dyno: options.dyno,
      lines: options.lines,
      onSessionCreated({generation, isRecreate}) {
        // Fir's stream takes a moment to provision; print a hint
        // before the first session so users don't think we're
        // hung. Don't repeat it on tail-timeout recreates.
        if (generation === 'fir' && !isRecreate) {
          process.stderr.write(color.info('Fetching logs...\n\n'))
        }
      },
      signal: controller.signal,
      source: options.source,
      tail: options.tail,
      type: options.type,
    })) {
      ux.stdout(colorize(line))
    }
  } catch (error) {
    if (controller.signal.aborted) return
    const message = error instanceof Error ? error.message : String(error)
    ux.error(message, {exit: 1})
  } finally {
    process.off('SIGINT', onAbort)
    process.off('SIGTERM', onAbort)
  }
}
