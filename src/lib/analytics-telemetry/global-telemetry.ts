/**
 * Global telemetry orchestrator
 * This module provides the main public API for telemetry and delegates to specialized modules
 */

import type {Config} from '@oclif/core/interfaces'

// Import internal dependencies
import {
  isTelemetryDisabled,
  setVersion,
  Telemetry,
  TelemetryData,
  telemetryDebug,
} from './telemetry-utils.js'

// Lazy client singletons - only loaded when actually needed
let backboardOtelClientInstance: any
let sentryClientInstance: any

/**
 * Lazy load telemetry clients to avoid loading heavy OpenTelemetry/Sentry
 * libraries during CLI initialization
 */
async function getClients() {
  if (!backboardOtelClientInstance) {
    const [{default: BackboardOtelClient}, {default: SentryClient}] = await Promise.all([
      import('./backboard-otel-client.js'),
      import('./sentry-client.js'),
    ])
    backboardOtelClientInstance = new BackboardOtelClient()
    sentryClientInstance = new SentryClient()
    telemetryDebug('Lazy-loaded telemetry clients')
  }

  return {
    backboardOtelClient: backboardOtelClientInstance,
    sentryClient: sentryClientInstance,
  }
}

/**
 * Options passed to telemetry setup (from oclif hooks)
 */
interface TelemetryOptions {
  Command?: {
    id: string
  }
  id?: string
}

/**
 * Create telemetry object for command_not_found errors
 */
export function reportCmdNotFound(config: Config): Telemetry {
  return {
    _type: 'otel',
    cliRunDuration: 0,
    command: 'invalid_command',
    commandRunDuration: 0,
    exitCode: 0,
    exitState: 'command_not_found',
    isTTY: process.stdin.isTTY,
    isVersionOrHelp: false,
    lifecycleHookCompletion: {
      command_not_found: true,
      init: true,
      postrun: false,
      prerun: false,
    },
    os: config.platform,
    version: config.version,
  }
}

/**
 * Main orchestrator: Send telemetry data to appropriate destinations
 * - Errors go to both Honeycomb and Sentry
 * - Regular telemetry goes to Honeycomb only
 */
export async function sendTelemetry(currentTelemetry: TelemetryData): Promise<void> {
  if (isTelemetryDisabled) {
    telemetryDebug('Telemetry disabled, skipping send')
    return
  }

  const {backboardOtelClient, sentryClient} = await getClients()
  const telemetry = currentTelemetry

  if (telemetry instanceof Error) {
    // Filter SIGINT errors from Sentry (user Ctrl+C is not an error to report)
    // But still send to Honeycomb for analytics
    const isSIGINT = telemetry.message === 'Received SIGINT'

    if (isSIGINT) {
      telemetryDebug('Sending error to Honeycomb: %s', telemetry.message)
      await backboardOtelClient.send(telemetry)
    } else {
      telemetryDebug('Sending error to Honeycomb and Sentry: %s', telemetry.message)
      await Promise.all([
        backboardOtelClient.send(telemetry),
        sentryClient.send(telemetry),
      ])
    }
  } else {
    telemetryDebug('Sending telemetry for command: %s', telemetry.command)
    await backboardOtelClient.send(telemetry)
  }
}

/**
 * Create telemetry object for regular commands or version/help
 */
export function setupTelemetry(config: Config, opts: TelemetryOptions): Telemetry {
  // Store version from config (eliminates need to read package.json)
  setVersion(config.version)

  const now = new Date()
  const cmdStartTime = now.getTime()
  const isRegularCmd = Boolean(opts.Command)
  const mcpMode = process.env.HEROKU_MCP_MODE === 'true'
  const mcpServerVersion = process.env.HEROKU_MCP_SERVER_VERSION || 'unknown'

  const irregularTelemetryObject: Telemetry = {
    _type: 'otel',
    cliRunDuration: 0,
    command: opts.id || 'unknown',
    commandRunDuration: cmdStartTime,
    exitCode: 0,
    exitState: 'successful',
    isTTY: process.stdin.isTTY,
    isVersionOrHelp: true,
    lifecycleHookCompletion: {
      command_not_found: false,
      init: true,
      postrun: false,
      prerun: false,
    },
    os: config.platform,
    version: `${config.version}${mcpMode ? ` (MCP ${mcpServerVersion})` : ''}`,
  }

  if (isRegularCmd && opts.Command) {
    return {
      ...irregularTelemetryObject,
      command: opts.Command.id,
      isVersionOrHelp: false,
      lifecycleHookCompletion: {
        ...irregularTelemetryObject.lifecycleHookCompletion,
        prerun: true,
      },
    }
  }

  return irregularTelemetryObject
}
