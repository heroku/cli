import {expect} from 'chai'
import {spawn} from 'node:child_process'
import {closeSync, openSync} from 'node:fs'
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import {setTimeout as setNativeTimeout} from 'node:timers'
import {fileURLToPath} from 'node:url'

interface RequestRecord {
  body: unknown
  factorHeader?: boolean
  method?: string
  url?: string
}

const cliRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

const sanitizeTranscript = (transcript: string) => transcript
  .replaceAll(new RegExp(`${String.fromCodePoint(27)}\\[[0-?]*[ -/]*[@-~]`, 'g'), '')
  .replaceAll('\r', '\n')
  .replaceAll(/\n+/g, '\n')
  .trim()

const redactDiagnostic = (diagnostic: string) => diagnostic
  .replaceAll('test-api-key', '[REDACTED]')
  .replaceAll('123456', '[REDACTED]')
  .replaceAll(/(authorization\s*[:=]\s*)(?:bearer|basic)\s+[^\s,}]+/gi, '$1[REDACTED]')
  .replaceAll(/((?:two-factor|2fa)[ _-]?(?:code|token)\s*[:=]\s*)[^\s,}]+/gi, '$1[REDACTED]')
  .replaceAll(/("?[A-Z][A-Z0-9_]*"?\s*[:=]\s*)("[^"]*"|[^\s,}]+)/g, '$1[REDACTED]')

const childEnvironment = (tempDir: string, host: string): NodeJS.ProcessEnv => {
  const env: NodeJS.ProcessEnv = {}
  for (const name of ['ComSpec', 'LANG', 'LC_ALL', 'PATH', 'PATHEXT', 'SystemRoot', 'WINDIR']) {
    if (process.env[name]) env[name] = process.env[name]
  }

  return {
    ...env,
    APPDATA: path.join(tempDir, 'appdata'),
    COLUMNS: '80',
    DISABLE_TELEMETRY: 'true',
    FORCE_COLOR: '0',
    HEROKU_API_KEY: 'test-api-key',
    HEROKU_HOST: host,
    HEROKU_SKIP_NEW_VERSION_CHECK: 'true',
    HOME: tempDir,
    HTTP_PROXY: '',
    http_proxy: '',
    HTTPS_PROXY: '',
    https_proxy: '',
    IS_HEROKU_TEST_ENV: 'true',
    LINES: '24',
    LOCALAPPDATA: path.join(tempDir, 'local-appdata'),
    NO_PROXY: '127.0.0.1,localhost',
    no_proxy: '127.0.0.1,localhost',
    TEMP: tempDir,
    TERM: 'dumb',
    TMP: tempDir,
    TMPDIR: tempDir,
    USERPROFILE: tempDir,
    XDG_CACHE_HOME: path.join(tempDir, 'cache'),
    XDG_CONFIG_HOME: path.join(tempDir, 'config'),
    XDG_DATA_HOME: path.join(tempDir, 'data'),
  }
}

const stopChild = async (child: ReturnType<typeof spawn> | undefined) => {
  if (!child || child.exitCode !== null || child.signalCode !== null) return

  await new Promise<void>((resolve, reject) => {
    const onClose = () => {
      clearTimeout(fallback)
      resolve()
    }

    const fallback = setNativeTimeout(() => {
      child.removeListener('close', onClose)
      reject(new Error('subprocess did not close within 2000ms after SIGKILL'))
    }, 2000)
    child.once('close', onClose)
    child.kill('SIGKILL')
  })
}

const configDonePattern = /\.\.\.\s*done\b|^\s*done\b/im
const configResultRowPattern = /^\s*[A-Z][A-Z0-9_]*:\s+\S/m

describe('config:set', function () {
  // The test keeps lifecycle cleanup and contract diagnostics together.
  // eslint-disable-next-line complexity
  it('rejects a 2fa challenge without an interactive terminal', async function () {
    this.timeout(30_000)

    const requests: RequestRecord[] = []
    const requestViolations: string[] = []
    const sockets = new Set<import('node:net').Socket>()
    const server = http.createServer((request, response) => {
      const chunks: Buffer[] = []
      request.on('data', chunk => chunks.push(Buffer.from(chunk)))
      request.on('end', () => {
        const rawBody = Buffer.concat(chunks).toString('utf8')
        let body: unknown
        try {
          body = JSON.parse(rawBody)
        } catch {
          body = rawBody
          requestViolations.push(`expected JSON request body, received ${JSON.stringify(rawBody)}`)
        }

        requests.push({body, method: request.method, url: request.url})
        if (request.method !== 'PATCH') requestViolations.push(`expected PATCH, received ${request.method}`)
        if (request.url !== '/apps/myapp/config-vars') requestViolations.push(`expected /apps/myapp/config-vars, received ${request.url}`)
        if (JSON.stringify(body) !== JSON.stringify({RACK_ENV: 'production'})) {
          requestViolations.push(`expected {"RACK_ENV":"production"}, received ${JSON.stringify(body)}`)
        }

        response.writeHead(403, {'content-type': 'application/json'})
        response.end(JSON.stringify({
          app: {name: 'myapp'},
          id: 'two_factor',
          message: 'Two-factor authentication required',
        }))
      })
    })
    server.on('connection', socket => {
      sockets.add(socket)
      socket.on('close', () => sockets.delete(socket))
    })

    let child: ReturnType<typeof spawn> | undefined
    let outputFd: number | undefined
    let tempDir: string | undefined
    let transcript = ''
    let exitCode: null | number = null
    let signal: NodeJS.Signals | null = null
    let childError: Error | undefined
    let timedOut = false
    let testError: unknown
    let cleanupError: unknown

    try {
      tempDir = await mkdtemp(path.join(os.tmpdir(), 'heroku-config-set-'))
      const outputPath = path.join(tempDir, 'combined-output.log')
      const cacheDirs = [
        path.join(tempDir, 'cache', 'heroku'),
        path.join(tempDir, 'Library', 'Caches', 'heroku'),
      ]
      await Promise.all(cacheDirs.map(async cacheDir => {
        await mkdir(cacheDir, {recursive: true})
        await writeFile(path.join(cacheDir, 'terms-of-service'), '')
      }))
      outputFd = openSync(outputPath, 'w+')

      await new Promise<void>((resolve, reject) => {
        server.once('error', reject)
        server.listen(0, '127.0.0.1', resolve)
      })
      const address = server.address()
      if (!address || typeof address === 'string') throw new Error('fixture server did not expose a TCP port')

      child = spawn(process.execPath, [path.join(cliRoot, 'bin/run.js'), 'config:set', 'RACK_ENV=production', '--app', 'myapp'], {
        cwd: cliRoot,
        env: childEnvironment(tempDir, `http://127.0.0.1:${address.port}`),
        stdio: ['pipe', outputFd, outputFd],
      })
      if (!child.stdin) throw new Error('subprocess stdin was not piped')
      child.stdin.end()

      await new Promise<void>(resolve => {
        const timeout = setNativeTimeout(() => {
          timedOut = true
          child?.kill('SIGKILL')
        }, 15_000)

        child?.once('error', error => {
          childError = error
          clearTimeout(timeout)
          resolve()
        })
        child?.once('close', (code, childSignal) => {
          exitCode = code
          signal = childSignal
          clearTimeout(timeout)
          resolve()
        })
      })

      closeSync(outputFd)
      outputFd = undefined
      transcript = sanitizeTranscript(await readFile(outputPath, 'utf8'))

      const violations = [...requestViolations]
      if (requests.length !== 1) violations.push(`expected exactly one request, received ${requests.length}`)
      if (childError) violations.push(`subprocess error: ${childError.message}`)
      if (timedOut) violations.push('subprocess timed out')
      if (typeof exitCode !== 'number' || exitCode === 0) violations.push(`expected a numeric nonzero exit code, received ${String(exitCode)}`)
      if (signal !== null) violations.push(`expected no signal, received ${signal}`)

      const actionMatch = /Setting\s+RACK_ENV\s+and restarting[^\n]*myapp/i.exec(transcript)
      if (!actionMatch) {
        violations.push('missing config action output')
      }

      const actionStart = actionMatch?.index ?? -1
      const actionOutput = actionStart >= 0 ? transcript.slice(actionStart) : transcript
      const failedMarkers = [...actionOutput.matchAll(/(?:^|\s)!(?=\s|$)/g)]
      if (failedMarkers.length !== 1) violations.push(`expected one meaningful failed marker, received ${failedMarkers.length}`)
      const failedMarkerRelativeIndex = failedMarkers[0]?.index ?? -1
      const failedMarkerIndex = failedMarkerRelativeIndex < 0 ? -1 : actionStart + failedMarkerRelativeIndex + failedMarkers[0][0].lastIndexOf('!')

      const promptFailureMatch = /Two-factor authentication requires an interactive terminal/i.exec(actionOutput)
      if (!promptFailureMatch) {
        violations.push('missing clear noninteractive two-factor error')
      }

      const promptFailureIndex = promptFailureMatch ? actionStart + promptFailureMatch.index : -1
      if (actionStart >= 0 && failedMarkerIndex >= 0 && promptFailureIndex >= 0 && !(actionStart < failedMarkerIndex && failedMarkerIndex < promptFailureIndex)) {
        violations.push('expected config action start before failed marker before noninteractive two-factor error')
      }

      if (/warning: detected unsettled top-level await/i.test(transcript)) {
        violations.push('printed an unsettled top-level-await warning')
      }

      if (configDonePattern.test(actionOutput)) violations.push('printed a successful config action completion')
      if (configResultRowPattern.test(actionOutput)) violations.push('printed a config result row')

      const promptFailureSuffix = promptFailureMatch ? actionOutput.slice(promptFailureMatch.index + promptFailureMatch[0].length) : ''
      if (configDonePattern.test(promptFailureSuffix)) violations.push('printed a successful config action completion after prompt failure')
      if (configResultRowPattern.test(promptFailureSuffix)) violations.push('printed a config result row after prompt failure')

      const diagnostic = [
        `exit=${String(exitCode)} signal=${String(signal)}`,
        `requests=${JSON.stringify(requests)}`,
        `transcript:\n${transcript}`,
      ].join('\n')
      const redactedDiagnostic = redactDiagnostic(diagnostic)
      expect(violations, redactedDiagnostic).to.deep.equal([])
    } catch (error) {
      testError = error
    } finally {
      try {
        await stopChild(child)
      } catch (error) {
        cleanupError = error
      }

      try {
        if (outputFd !== undefined) closeSync(outputFd)
      } catch (error) {
        cleanupError ??= error
      }

      for (const socket of sockets) socket.destroy()
      try {
        if (server.listening) {
          await new Promise<void>(resolve => {
            server.close(() => resolve())
          })
        }
      } catch (error) {
        cleanupError ??= error
      }

      try {
        if (tempDir) await rm(tempDir, {force: true, recursive: true})
      } catch (error) {
        cleanupError ??= error
      }
    }

    if (cleanupError && testError) throw new AggregateError([testError, cleanupError], 'test and cleanup failed')
    if (cleanupError) throw cleanupError
    if (testError) throw testError
  })

  // The test keeps lifecycle cleanup and contract diagnostics together.
  // eslint-disable-next-line complexity
  it('rejects a piped factor without preauthorizing', async function () {
    this.timeout(30_000)

    const requests: RequestRecord[] = []
    const requestViolations: string[] = []
    const sockets = new Set<import('node:net').Socket>()
    let initialPatchReceivedResolve: (() => void) | undefined
    const initialPatchReceived = new Promise<void>(resolve => {
      initialPatchReceivedResolve = resolve
    })
    const server = http.createServer((request, response) => {
      const chunks: Buffer[] = []
      request.on('data', chunk => chunks.push(Buffer.from(chunk)))
      request.on('end', () => {
        const rawBody = Buffer.concat(chunks).toString('utf8')
        const requestIndex = requests.length
        let body: unknown = rawBody
        if (rawBody) {
          try {
            body = JSON.parse(rawBody)
          } catch {
            requestViolations.push(`request ${requestIndex + 1} had invalid JSON body ${JSON.stringify(rawBody)}`)
          }
        }

        const factorHeader = request.headers['heroku-two-factor-code']
        requests.push({
          body,
          factorHeader: factorHeader !== undefined,
          method: request.method,
          url: request.url,
        })

        if (requestIndex === 0 && request.method === 'PATCH' && request.url === '/apps/myapp/config-vars') {
          if (JSON.stringify(body) !== JSON.stringify({RACK_ENV: 'production'})) {
            requestViolations.push(`initial config PATCH had unexpected body ${JSON.stringify(body)}`)
          }

          if (factorHeader !== undefined) requestViolations.push('initial config PATCH unexpectedly included a factor header')
          response.writeHead(403, {'content-type': 'application/json'})
          response.end(JSON.stringify({
            app: {name: 'myapp'},
            id: 'two_factor',
            message: 'Two-factor authentication required',
          }), initialPatchReceivedResolve)
          return
        }

        requestViolations.push(`unexpected request ${requestIndex + 1}: ${request.method} ${request.url}`)
        response.writeHead(500, {'content-type': 'application/json'})
        response.end(JSON.stringify({id: 'unexpected_route', message: 'Unexpected fixture route'}))
      })
    })
    server.on('connection', socket => {
      sockets.add(socket)
      socket.on('close', () => sockets.delete(socket))
    })

    let child: ReturnType<typeof spawn> | undefined
    let outputFd: number | undefined
    let tempDir: string | undefined
    let transcript = ''
    let exitCode: null | number = null
    let signal: NodeJS.Signals | null = null
    let childError: Error | undefined
    let timedOut = false
    let testError: unknown
    let cleanupError: unknown

    try {
      tempDir = await mkdtemp(path.join(os.tmpdir(), 'heroku-config-set-'))
      const outputPath = path.join(tempDir, 'combined-output.log')
      const cacheDirs = [
        path.join(tempDir, 'cache', 'heroku'),
        path.join(tempDir, 'Library', 'Caches', 'heroku'),
      ]
      await Promise.all(cacheDirs.map(async cacheDir => {
        await mkdir(cacheDir, {recursive: true})
        await writeFile(path.join(cacheDir, 'terms-of-service'), '')
      }))
      outputFd = openSync(outputPath, 'w+')

      await new Promise<void>((resolve, reject) => {
        server.once('error', reject)
        server.listen(0, '127.0.0.1', resolve)
      })
      const address = server.address()
      if (!address || typeof address === 'string') throw new Error('fixture server did not expose a TCP port')

      child = spawn(process.execPath, [path.join(cliRoot, 'bin/run.js'), 'config:set', 'RACK_ENV=production', '--app', 'myapp'], {
        cwd: cliRoot,
        env: childEnvironment(tempDir, `http://127.0.0.1:${address.port}`),
        stdio: ['pipe', outputFd, outputFd],
      })
      if (!child.stdin) throw new Error('subprocess stdin was not piped')

      const childCompletion = new Promise<void>(resolve => {
        const timeout = setNativeTimeout(() => {
          timedOut = true
          child?.kill('SIGKILL')
        }, 15_000)

        child?.once('error', error => {
          childError = error
          clearTimeout(timeout)
          resolve()
        })
        child?.once('close', (code, childSignal) => {
          exitCode = code
          signal = childSignal
          clearTimeout(timeout)
          resolve()
        })
      })

      let initialPatchTimeout: NodeJS.Timeout | undefined
      const initialPatchTimeoutPromise = new Promise<'timeout'>(resolve => {
        initialPatchTimeout = setNativeTimeout(() => resolve('timeout'), 10_000)
      })
      const firstEvent = await Promise.race([
        initialPatchReceived.then(() => 'patch' as const),
        childCompletion.then(() => 'exit' as const),
        initialPatchTimeoutPromise,
      ])
      if (initialPatchTimeout) clearTimeout(initialPatchTimeout)
      if (firstEvent === 'exit') {
        throw new Error(`subprocess exited before the initial config PATCH: exit=${String(exitCode)} signal=${String(signal)} error=${childError?.message ?? 'none'}`)
      }

      if (firstEvent === 'timeout') throw new Error('initial config PATCH was not received within 10000ms')

      child.stdin.end('123456\n')
      await childCompletion

      closeSync(outputFd)
      outputFd = undefined
      transcript = sanitizeTranscript(await readFile(outputPath, 'utf8'))

      const violations = [...requestViolations]
      const expectedRequests: RequestRecord[] = [{
        body: {RACK_ENV: 'production'},
        factorHeader: false,
        method: 'PATCH',
        url: '/apps/myapp/config-vars',
      }]
      if (JSON.stringify(requests) !== JSON.stringify(expectedRequests)) violations.push('piped factor triggered an unexpected request')
      if (childError) violations.push(`subprocess error: ${childError.message}`)
      if (timedOut) violations.push('subprocess timed out')
      if (typeof exitCode !== 'number' || exitCode === 0) violations.push(`expected a numeric nonzero exit code, received ${String(exitCode)}`)
      if (signal !== null) violations.push(`expected no signal, received ${signal}`)

      const actionMatch = /Setting\s+RACK_ENV\s+and restarting[^\n]*myapp/i.exec(transcript)
      if (!actionMatch) violations.push('missing config action output')

      const actionStart = actionMatch?.index ?? -1
      const actionOutput = actionStart >= 0 ? transcript.slice(actionStart) : transcript
      const failedMarkers = [...actionOutput.matchAll(/(?:^|\s)!(?=\s|$)/g)]
      if (failedMarkers.length !== 1) violations.push(`expected one meaningful failed marker, received ${failedMarkers.length}`)
      const failedMarkerRelativeIndex = failedMarkers[0]?.index ?? -1
      const failedMarkerIndex = failedMarkerRelativeIndex < 0 ? -1 : actionStart + failedMarkerRelativeIndex + failedMarkers[0][0].lastIndexOf('!')

      const rejectionMatch = /Two-factor authentication requires an interactive terminal/i.exec(actionOutput)
      if (!rejectionMatch) violations.push('missing clear noninteractive two-factor error')
      const rejectionIndex = rejectionMatch ? actionStart + rejectionMatch.index : -1
      if (actionStart >= 0 && failedMarkerIndex >= 0 && rejectionIndex >= 0 && !(actionStart < failedMarkerIndex && failedMarkerIndex < rejectionIndex)) {
        violations.push('expected config action start before failed marker before noninteractive two-factor error')
      }

      if (/warning: detected unsettled top-level await/i.test(transcript)) violations.push('printed an unsettled top-level-await warning')
      if (configDonePattern.test(actionOutput)) violations.push('printed a successful config action completion')
      if (configResultRowPattern.test(actionOutput)) violations.push('printed a config result row')
      if (/\bdone,\s*v\d+\b|\brelease\s+v\d+\b/i.test(actionOutput)) violations.push('printed release success output')

      const rejectionSuffix = rejectionMatch ? actionOutput.slice(rejectionMatch.index + rejectionMatch[0].length) : ''
      if (configDonePattern.test(rejectionSuffix)) violations.push('printed a successful config action completion after the two-factor error')
      if (configResultRowPattern.test(rejectionSuffix)) violations.push('printed a config result row after the two-factor error')

      const diagnostic = [
        `exit=${String(exitCode)} signal=${String(signal)}`,
        `requests=${JSON.stringify(requests)}`,
        `transcript:\n${transcript}`,
      ].join('\n')
      const redactedDiagnostic = redactDiagnostic(diagnostic)
      expect(violations, redactedDiagnostic).to.deep.equal([])
    } catch (error) {
      testError = error
    } finally {
      try {
        await stopChild(child)
      } catch (error) {
        cleanupError = error
      }

      try {
        if (outputFd !== undefined) closeSync(outputFd)
      } catch (error) {
        cleanupError ??= error
      }

      for (const socket of sockets) socket.destroy()
      try {
        if (server.listening) {
          await new Promise<void>(resolve => {
            server.close(() => resolve())
          })
        }
      } catch (error) {
        cleanupError ??= error
      }

      try {
        if (tempDir) await rm(tempDir, {force: true, recursive: true})
      } catch (error) {
        cleanupError ??= error
      }
    }

    if (cleanupError && testError) throw new AggregateError([testError, cleanupError], 'test and cleanup failed')
    if (cleanupError) throw cleanupError
    if (testError) throw testError
  })
})
