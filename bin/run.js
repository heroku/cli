#!/usr/bin/env -S node --no-deprecation
/* eslint-disable n/no-process-exit */
/* eslint-disable n/no-unpublished-bin */

import {execute, settings} from '@oclif/core'
import {spawn} from 'node:child_process'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

// Enable performance tracking when DEBUG=oclif:perf or DEBUG=* is set
if (process.env.DEBUG?.includes('oclif:perf') || process.env.DEBUG === '*') {
  settings.performanceEnabled = true
}

process.env.HEROKU_UPDATE_INSTRUCTIONS = process.env.HEROKU_UPDATE_INSTRUCTIONS || 'update with: "npm update -g heroku"'

const now = new Date()
const cliStartTime = now.getTime()

// Skip telemetry entirely on Windows for performance (unless explicitly enabled)
const enableTelemetry = process.platform !== 'win32' || process.env.ENABLE_WINDOWS_TELEMETRY === 'true'
let globalTelemetry
const __dirname = dirname(fileURLToPath(import.meta.url))

if (enableTelemetry) {
  // Dynamically import telemetry only for computeDuration helper
  globalTelemetry = await import('../dist/lib/analytics-telemetry/global-telemetry.js')
}

/**
 * Serialize data for telemetry worker, handling Error objects specially
 */
function serializeTelemetryData(data) {
  // If it's an Error object, convert to plain object with all properties
  if (data instanceof Error) {
    return JSON.stringify({
      cliRunDuration: data.cliRunDuration,
      code: data.code,
      message: data.message,
      name: data.name,
      stack: data.stack,
      // Include any other enumerable properties
      ...data,
    })
  }

  return JSON.stringify(data)
}

/**
 * Spawn telemetry worker process in background
 * This avoids blocking the main CLI process with telemetry overhead
 */
function spawnTelemetryWorker(data) {
  try {
    const workerPath = join(__dirname, '..', 'dist', 'lib', 'analytics-telemetry', 'telemetry-worker.js')
    const child = spawn(process.execPath, [workerPath], {
      detached: true,
      // Keep stderr attached to see DEBUG output, but ignore stdout
      stdio: ['pipe', 'ignore', 'inherit'],
    })

    // Send data via stdin
    child.stdin.write(serializeTelemetryData(data))
    child.stdin.end()

    // Detach from parent so it can exit immediately
    child.unref()
  } catch {
    // Silently fail - don't let telemetry errors affect user experience
  }
}

process.once('beforeExit', code => {
  if (!enableTelemetry) return

  // capture as successful exit
  if (global.cliTelemetry) {
    if (global.cliTelemetry.isVersionOrHelp) {
      const cmdStartTime = global.cliTelemetry.commandRunDuration
      global.cliTelemetry.commandRunDuration = globalTelemetry.computeDuration(cmdStartTime)
    }

    global.cliTelemetry.exitCode = code
    global.cliTelemetry.cliRunDuration = globalTelemetry.computeDuration(cliStartTime)
    const telemetryData = global.cliTelemetry

    // Spawn background process to send telemetry without blocking exit
    spawnTelemetryWorker(telemetryData)
  }
})

process.on('SIGINT', () => {
  if (enableTelemetry) {
    // Spawn background process to send telemetry
    const error = new Error('Received SIGINT')
    error.cliRunDuration = globalTelemetry.computeDuration(cliStartTime)
    spawnTelemetryWorker(error)
  }

  process.exit(1)
})

process.on('SIGTERM', () => {
  if (enableTelemetry) {
    // Spawn background process to send telemetry
    const error = new Error('Received SIGTERM')
    error.cliRunDuration = globalTelemetry.computeDuration(cliStartTime)
    spawnTelemetryWorker(error)
  }

  process.exit(1)
})

await execute({dir: import.meta.url})
