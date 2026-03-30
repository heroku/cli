/**
 * Global telemetry orchestrator
 * This module provides the main public API for telemetry and delegates to specialized modules
 */

import type {Config} from '@oclif/core/interfaces'

// Import internal dependencies
import {sendToHoneycomb} from './honeycomb-client.js'
import {sendToSentry} from './sentry-client.js'
import {
  isTelemetryDisabled,
  setVersion,
  Telemetry,
  TelemetryData,
  telemetryDebug,
} from './telemetry-utils.js'

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

  const telemetry = currentTelemetry

  if (telemetry instanceof Error) {
    telemetryDebug('Sending error to Honeycomb and Sentry: %s', telemetry.message)
    await Promise.all([
      sendToHoneycomb(telemetry),
      sendToSentry(telemetry),
    ])
  } else {
    telemetryDebug('Sending telemetry for command: %s', telemetry.command)
    await sendToHoneycomb(telemetry)
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
