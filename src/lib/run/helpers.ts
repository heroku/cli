/* eslint-disable @typescript-eslint/ban-ts-comment */
import type {APIClient} from '@heroku-cli/command'

import {ux} from '@oclif/core'
import * as https from 'https'
import {URL} from 'url'

import type {App} from '../types/fir.js'

// this function exists because oclif sorts argv
// and to capture all non-flag command inputs
export function revertSortedArgs(processArgs: Array<string>, argv: Array<string>) {
  const originalInputOrder = []
  const flagRegex = /^--?/
  let isSeparatorPresent = false
  let argIsFlag = false

  // this for-loop performs 2 tasks
  // 1. reorders the arguments in the order the user inputted
  // 2. checks that no oclif flags are included in originalInputOrder
  for (const processArg of processArgs) {
    argIsFlag = flagRegex.test(processArg)

    if (processArg === '--') {
      isSeparatorPresent = true
    }

    if ((argv.includes(processArg) && (!isSeparatorPresent && !argIsFlag))
        || (argv.includes(processArg) && (isSeparatorPresent))) {
      originalInputOrder.push(processArg)
    }
  }

  return originalInputOrder
}

export function buildCommand(args: Array<string>, prependLauncher: boolean = false) {
  const prependText = prependLauncher ? 'launcher ' : ''

  if (args.length === 1) {
    // do not add quotes around arguments if there is only one argument
    // `heroku run "rake test"` should work like `heroku run rake test`
    return `${prependText}${args[0]}`
  }

  let cmd = ''
  for (let arg of args) {
    if (arg.includes(' ') || arg.includes('"')) {
      arg = '"' + arg.replace(/"/g, '\\"') + '"'
    }

    cmd = cmd + ' ' + arg
  }

  return `${prependText}${cmd.trim()}`
}

export function buildEnvFromFlag(flag: string) {
  const env = {}
  for (const v of flag.split(';')) {
    const m = v.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
    // @ts-ignore
    if (m) env[m[1]] = m[2]
    else ux.warn(`env flag ${v} appears invalid. Avoid using ';' in values.`)
  }

  return env
}

/**
 * Determines whether to prepend `launcher` to the command for a given app.
 * Behavior: Only prepend on CNB stack apps and when not explicitly disabled.
 */
export async function shouldPrependLauncher(heroku: APIClient, appName: string, disableLauncher: boolean): Promise<boolean> {
  if (disableLauncher) return false

  const {body: app} = await heroku.get<App>(`/apps/${appName}`, {
    headers: {Accept: 'application/vnd.heroku+json; version=3.sdk'},
  })

  return (app.stack && app.stack.name) === 'cnb'
}

/**
 * Builds the command string, automatically deciding whether to prepend `launcher`.
 */
export async function buildCommandWithLauncher(
  heroku: APIClient,
  appName: string,
  args: string[],
  disableLauncher: boolean,
): Promise<string> {
  const prependLauncher = await shouldPrependLauncher(heroku, appName, disableLauncher)
  return buildCommand(args, prependLauncher)
}

/**
 * Fetches the response body from an HTTP request when the response body isn't available
 * from the error object (e.g., EventSource doesn't expose response bodies).
 *
 * Uses native fetch API with a custom https.Agent to handle staging SSL certificates
 * (rejectUnauthorized: false).
 *
 * Note: Node.js native fetch doesn't support custom agents directly, so we use
 * https.request when rejectUnauthorized is needed, but structure the code with
 *
 * @param url - The URL to fetch the response body from
 * @param expectedStatusCode - Only return body if status code matches (default: 403)
 * @returns The response body as a string, or empty string if unavailable or status doesn't match
 */
export async function fetchHttpResponseBody(url: string, expectedStatusCode: number = 403): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

  try {
    const parsedUrl = new URL(url)
    const userAgent = process.env.HEROKU_DEBUG_USER_AGENT || 'heroku-run'

    // Note: Native fetch in Node.js doesn't support custom https.Agent for SSL certificate handling.
    // We use https.request when rejectUnauthorized: false is needed (staging environments).
    // This maintains compatibility while using modern async/await and AbortController patterns.
    if (parsedUrl.protocol !== 'https:') {
      // For non-HTTPS URLs, use native fetch
      const response = await fetch(url, {
        headers: {
          Accept: 'text/plain',
          'User-Agent': userAgent,
        },
        method: 'GET',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.status === expectedStatusCode) {
        return await response.text()
      }

      return ''
    }

    // For HTTPS with rejectUnauthorized: false (staging), use https.request
    // This is the same pattern as dyno.ts - necessary for staging SSL certs
    return await new Promise<string>(resolve => {
      const cleanup = (): void => {
        clearTimeout(timeoutId)
        controller.abort()
      }

      const options: https.RequestOptions = {
        headers: {
          Accept: 'text/plain',
          'User-Agent': userAgent,
        },
        hostname: parsedUrl.hostname,
        method: 'GET',
        path: parsedUrl.pathname + parsedUrl.search,
        port: parsedUrl.port || 443,
        rejectUnauthorized: false, // Allow staging self-signed certificates
      }

      const req = https.request(options, res => {
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

      req.on('error', () => {
        cleanup()
        resolve('')
      })

      // Abort on timeout
      controller.signal.addEventListener('abort', () => {
        req.destroy()
        resolve('')
      }, {once: true})

      req.end()
    })
  } catch (error: unknown) {
    clearTimeout(timeoutId)

    // AbortError is expected on timeout - return empty string
    if (error instanceof Error && error.name === 'AbortError') {
      return ''
    }

    // For other errors, return empty string for graceful degradation
    // This matches the previous behavior where errors returned empty string
    return ''
  }
}
