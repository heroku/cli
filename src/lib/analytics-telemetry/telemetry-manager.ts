/**
 * Global telemetry manager
 * This module provides the main public API for telemetry and delegates to specialized modules
 */

import type {Config} from '@oclif/core/interfaces'

import {NONINTERACTIVE_LOGIN_ERROR_CODE} from '@heroku-cli/command'

import type BackboardOtelClient from './backboard-otel-client.js'
import type SentryClient from './sentry-client.js'

// Import internal dependencies
import {
  isTelemetryEnabled,
  setVersion,
  Telemetry,
  TelemetryData,
  telemetryDebug,
} from './telemetry-utils.js'

// NONINTERACTIVE_LOGIN_ERROR_CODE ('HEROKU_NONINTERACTIVE_LOGIN') is the code
// stamped on the error @heroku-cli/command throws when an interactive login is
// required but stdin is not a TTY (piped input, CI, or a 401 re-auth,
// W-22403348). Imported from @heroku-cli/command, the source of truth.

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
 * TelemetryManager - Singleton class for managing CLI telemetry
 */
class TelemetryManager {
  private backboardOtelClient?: BackboardOtelClient
  private sentryClient?: SentryClient

  /**
   * Create telemetry object for command_not_found errors
   */
  reportCmdNotFound(config: Config): Telemetry {
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
  async sendTelemetry(currentTelemetry: TelemetryData): Promise<void> {
    if (!isTelemetryEnabled()) {
      return
    }

    const {backboardOtelClient, sentryClient} = await this.getClients()
    const telemetry = currentTelemetry

    if (telemetry instanceof Error) {
      // Some errors are expected user/environment conditions, not bugs. We still
      // send them to Honeycomb for analytics (so we can measure how often they
      // happen) but skip Sentry so they don't pollute error reporting:
      //   - SIGINT: the user pressed Ctrl+C.
      //   - HEROKU_NONINTERACTIVE_LOGIN: an interactive login was required but
      //     stdin is not a TTY (piped input, CI, or a 401 re-auth) — W-22403348.
      const skipSentry = telemetry.message === 'Received SIGINT'
        || telemetry.code === NONINTERACTIVE_LOGIN_ERROR_CODE

      if (skipSentry) {
        telemetryDebug('Sending error to Honeycomb only (excluded from Sentry): %s', telemetry.message)
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
  setupTelemetry(config: Config, opts: TelemetryOptions): Telemetry {
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

  /**
   * Lazy load telemetry clients to avoid loading heavy OpenTelemetry/Sentry
   * libraries during CLI initialization
   */
  private async getClients(): Promise<{
    backboardOtelClient: BackboardOtelClient
    sentryClient: SentryClient
  }> {
    if (!this.backboardOtelClient || !this.sentryClient) {
      const [{default: BackboardOtelClient}, {default: SentryClient}] = await Promise.all([
        import('./backboard-otel-client.js'),
        import('./sentry-client.js'),
      ])
      this.backboardOtelClient = new BackboardOtelClient()
      this.sentryClient = new SentryClient()
      telemetryDebug('Lazy-loaded telemetry clients')
    }

    // TypeScript: Both clients are guaranteed to be defined after the above check
    return {
      backboardOtelClient: this.backboardOtelClient,
      sentryClient: this.sentryClient,
    }
  }
}

// Export singleton instance
export const telemetryManager = new TelemetryManager()
