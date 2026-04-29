#!/usr/bin/env -S node --no-deprecation

import net from 'net'
import fs from 'fs'

const SOCKET_PATH = '/tmp/heroku-test-daemon.sock'

// Check if daemon is available
function isDaemonAvailable() {
  return fs.existsSync(SOCKET_PATH)
}

// Execute via daemon
async function executeViaDaemon() {
  return new Promise((resolve, reject) => {
    const socket = net.connect(SOCKET_PATH)
    let response = ''

    socket.on('connect', () => {
      const request = {
        args: process.argv.slice(2),
      }
      socket.write(JSON.stringify(request) + '\n')
    })

    socket.on('data', (data) => {
      response += data.toString()
    })

    socket.on('end', () => {
      try {
        const result = JSON.parse(response)

        if (result.stdout) {
          process.stdout.write(result.stdout)
        }
        if (result.stderr) {
          process.stderr.write(result.stderr)
        }

        process.exit(result.exitCode)
      } catch (err) {
        reject(new Error(`Failed to parse daemon response: ${err.message}`))
      }
    })

    socket.on('error', (err) => {
      // Daemon not available, fall back to direct execution
      resolve(false)
    })

    socket.setTimeout(5000, () => {
      socket.destroy()
      resolve(false)
    })
  })
}

// Direct execution (original code)
async function executeDirect() {
  const {execute, settings} = await import('@oclif/core')

  // Enable performance tracking when oclif:perf is specified in DEBUG
  if (process.env.DEBUG?.includes('oclif:perf') || process.env.DEBUG === 'oclif:*' || process.env.DEBUG === '*') {
    settings.performanceEnabled = true
  }

  process.env.HEROKU_UPDATE_INSTRUCTIONS = process.env.HEROKU_UPDATE_INSTRUCTIONS || 'update with: "npm update -g heroku"'

  const now = new Date()
  const cliStartTime = now.getTime()

  const {getTelemetryDisabledReason, isTelemetryEnabled, telemetryDebug} = await import('../dist/lib/analytics-telemetry/telemetry-utils.js')
  const enableTelemetry = isTelemetryEnabled()

  if (enableTelemetry) {
    telemetryDebug('Telemetry enabled: setting up handlers (beforeExit, SIGINT, SIGTERM)')
    // Dynamically import telemetry modules
    const {setupTelemetryHandlers} = await import('../dist/lib/analytics-telemetry/worker-client.js')
    const {computeDuration} = await import('../dist/lib/analytics-telemetry/telemetry-utils.js')

    // Setup all telemetry handlers (beforeExit, SIGINT, SIGTERM)
    setupTelemetryHandlers({
      cliStartTime,
      computeDuration,
      enableTelemetry,
    })
  } else {
    const reason = getTelemetryDisabledReason()
    telemetryDebug('Telemetry disabled (%s): skipping telemetry handler setup', reason)
  }

  await execute({dir: import.meta.url})
}

// Main entry point - check daemon first!
if (isDaemonAvailable() && !process.env.HEROKU_NO_DAEMON) {
  await executeViaDaemon()
} else {
  await executeDirect()
}
