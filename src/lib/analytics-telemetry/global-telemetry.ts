/**
 * Global telemetry orchestrator
 * This module provides the main public API for telemetry and delegates to specialized modules
 */

// Re-export Honeycomb client functions
export {getProcessor, initializeInstrumentation} from './honeycomb-client.js'

export {ensureSentryInitialized} from './sentry-client.js'

// Import internal dependencies
import {sendToHoneycomb} from './honeycomb-client.js'
import {sendToSentry} from './sentry-client.js'
import {
  CLIError,
  isTelemetryDisabled,
  setVersion,
  Telemetry,
  telemetryDebug,
} from './telemetry-utils.js'

/**
 * Create telemetry object for command_not_found errors
 */
export function reportCmdNotFound(config: any): Telemetry {
  return {
    cliRunDuration: 0,
    command: 'invalid_command',
    commandRunDuration: 0,
    exitCode: 0,
    exitState: 'command_not_found',
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
export async function sendTelemetry(currentTelemetry: CLIError | Telemetry): Promise<void> {
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
export function setupTelemetry(config: any, opts: any): Telemetry {
  // Store version from config (eliminates need to read package.json)
  setVersion(config.version)

  const now = new Date()
  const cmdStartTime = now.getTime()
  const isRegularCmd = Boolean(opts.Command)
  const mcpMode = process.env.HEROKU_MCP_MODE === 'true'
  const mcpServerVersion = process.env.HEROKU_MCP_SERVER_VERSION || 'unknown'

  const irregularTelemetryObject: Telemetry = {
    cliRunDuration: 0,
    command: opts.id,
    commandRunDuration: cmdStartTime,
    exitCode: 0,
    exitState: 'successful',
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

  if (isRegularCmd) {
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

// Export ensureSentryInitialized for use by finally hook

// Re-export utilities and types
export {
  type CLIError,
  computeDuration,
  isTelemetryEnabled,
  type Telemetry,
  type TelemetryGlobal,
} from './telemetry-utils.js'
