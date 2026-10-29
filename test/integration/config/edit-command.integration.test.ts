import {expect} from 'chai'
import {spawn, spawnSync} from 'node:child_process'
import {existsSync} from 'node:fs'
import {
  chmod, mkdtemp, readdir, readFile, realpath, rm, writeFile,
} from 'node:fs/promises'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import {setTimeout as setNativeTimeout} from 'node:timers'
import {fileURLToPath} from 'node:url'

interface EditorMarker {
  cliPid: number
  editorPid: number
  heartbeatPath: string
  tempPath: string
}

interface ProcessExit {
  error?: Error
  exitCode: null | number
  signal: NodeJS.Signals | null
}

interface ProcessContext {
  child: ReturnType<typeof spawn>
  close: Promise<void>
  exit: Promise<ProcessExit>
  output: string
  stdout: string
}

interface PtyReady {
  cliPid: number
}

interface PtyWaitStatus {
  cliPid: number
  signal: null | number
  signaled: boolean
  waitStatus: number
}

interface RequestRecord {
  method?: string
  url?: string
}

interface Scenario {
  requests: RequestRecord[]
  result: ProcessExit
}

const cliRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const cliPath = path.join(cliRoot, 'bin/run.js')
const editorTempPrefix = 'heroku-myapp-config-'
const startupDeadlineMs = 30_000
const exitDeadlineMs = 30_000
const cleanupDeadlineMs = 3000
const ptyChildDeadlineSeconds = 20
const configRoute = '/apps/myapp/config-vars'
const configBody = JSON.stringify({SYNTHETIC_CONFIG: 'synthetic-value'})
const hasSystemPython = (): boolean => {
  if (process.platform !== 'darwin') return false
  try {
    return spawnSync('python3', ['-c', 'import os, pty, select, signal, sys, time'], {stdio: 'ignore', timeout: 5000}).status === 0
  } catch {
    return false
  }
}

const ptyPythonPath = hasSystemPython() ? 'python3' : undefined

const ptyHarnessSource = String.raw`
import errno
import json
import os
import pty
import select
import signal
import sys
import time

def emit(event, **values):
    print(event + " " + json.dumps(values, separators=(",", ":")), flush=True)

def kill_owned_process(pid):
    try:
        os.kill(pid, signal.SIGKILL)
    except ProcessLookupError:
        pass

cli_pid, master_fd = pty.fork()
if cli_pid == 0:
    os.execvpe(sys.argv[1], sys.argv[1:], os.environ)

reaped = False
try:
    emit("READY", cliPid=cli_pid)
    command = ""
    while not command:
        readable, _, _ = select.select([sys.stdin, master_fd], [], [], 0.1)
        if master_fd in readable:
            try:
                os.read(master_fd, 4096)
            except OSError as error:
                if error.errno != errno.EIO:
                    raise
        if sys.stdin in readable:
            command = sys.stdin.readline().strip()

    if command not in ("CLOSE", "ABORT"):
        raise RuntimeError("unexpected PTY harness command: " + command)

    os.close(master_fd)
    timeout = 0.25 if command == "ABORT" else ${ptyChildDeadlineSeconds}
    deadline = time.monotonic() + timeout
    while True:
        readable, _, _ = select.select([sys.stdin], [], [], 0)
        if readable and sys.stdin.readline().strip() == "ABORT":
            kill_owned_process(cli_pid)
        waited_pid, wait_status = os.waitpid(cli_pid, os.WNOHANG)
        if waited_pid == cli_pid:
            reaped = True
            break
        if time.monotonic() >= deadline:
            kill_owned_process(cli_pid)
            _, wait_status = os.waitpid(cli_pid, 0)
            reaped = True
            break
        time.sleep(0.025)

    if command == "ABORT":
        kill_owned_process(cli_pid)
    emit(
        "WAIT",
        cliPid=cli_pid,
        waitStatus=wait_status,
        signaled=os.WIFSIGNALED(wait_status),
        signal=os.WTERMSIG(wait_status) if os.WIFSIGNALED(wait_status) else None,
    )
except BaseException:
    try:
        os.close(master_fd)
    except OSError:
        pass
    kill_owned_process(cli_pid)
    if not reaped:
        os.waitpid(cli_pid, 0)
    raise
`

const delay = (ms: number) => new Promise(resolve => setNativeTimeout(resolve, ms))

const observeProcess = (child: ReturnType<typeof spawn>): ProcessContext => {
  let resolveExit = (_result: ProcessExit) => {}
  let resolveClose = () => {}
  let output = ''
  let stdout = ''
  const exit = new Promise<ProcessExit>(resolve => {
    resolveExit = resolve
  })
  const close = new Promise<void>(resolve => {
    resolveClose = resolve
  })

  child.once('error', error => resolveExit({error, exitCode: child.exitCode, signal: child.signalCode}))
  child.once('exit', (exitCode, signal) => resolveExit({exitCode, signal}))
  child.once('close', () => resolveClose())
  child.stdout?.on('data', chunk => {
    const text = chunk.toString()
    output += text
    stdout += text
  })
  child.stderr?.on('data', chunk => {
    output += chunk.toString()
  })
  child.stdin?.on('error', () => {})

  return {
    child, close, exit, get output() {
      return output
    }, get stdout() {
      return stdout
    },
  }
}

const waitForExit = async (exit: ProcessContext['exit'], timeoutMs = exitDeadlineMs): Promise<ProcessExit> => {
  let timeout: NodeJS.Timeout | undefined
  const result = await Promise.race([
    exit.then(value => ({value})),
    new Promise<{timeout: true}>(resolve => {
      timeout = setNativeTimeout(() => resolve({timeout: true}), timeoutMs)
    }),
  ])
  if (timeout) clearTimeout(timeout)
  if ('timeout' in result) throw new Error(`CLI did not terminate within ${timeoutMs}ms`)
  return result.value
}

const waitForProcessClose = async (context: ProcessContext): Promise<void> => {
  let timeout: NodeJS.Timeout | undefined
  const result = await Promise.race([
    context.close.then(() => ({closed: true as const})),
    new Promise<{timeout: true}>(resolve => {
      timeout = setNativeTimeout(() => resolve({timeout: true}), cleanupDeadlineMs)
    }),
  ])
  if (timeout) clearTimeout(timeout)
  if ('timeout' in result) throw new Error(`owned process ${context.child.pid ?? 'unknown'} did not close after exit`)
}

const isProcessAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ESRCH') return false
    throw error
  }
}

const waitForPidExit = async (pid: number, timeoutMs = exitDeadlineMs): Promise<void> => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline && isProcessAlive(pid)) await delay(25)
  if (isProcessAlive(pid)) throw new Error(`owned process ${pid} did not exit within ${timeoutMs}ms`)
}

const stopOwnedPid = async (pid: number | undefined): Promise<void> => {
  if (!pid || !isProcessAlive(pid)) return
  process.kill(pid, 'SIGTERM')
  const deadline = Date.now() + cleanupDeadlineMs
  while (Date.now() < deadline && isProcessAlive(pid)) await delay(25)
  if (!isProcessAlive(pid)) return
  process.kill(pid, 'SIGKILL')
  await waitForPidExit(pid, cleanupDeadlineMs)
}

const stopProcess = async (context: ProcessContext | undefined, isPtyHarness = false): Promise<void> => {
  if (!context) return
  if (isPtyHarness && context.child.exitCode === null && context.child.signalCode === null) {
    context.child.stdin?.write('ABORT\n')
  } else if (context.child.exitCode === null && context.child.signalCode === null) {
    context.child.kill('SIGKILL')
  }

  await waitForProcessClose(context)
}

const readMarker = async (markerPath: string): Promise<EditorMarker> => {
  const marker = JSON.parse(await readFile(markerPath, 'utf8')) as EditorMarker
  if (!Number.isSafeInteger(marker.cliPid) || marker.cliPid <= 0
    || !Number.isSafeInteger(marker.editorPid) || marker.editorPid <= 0
    || typeof marker.heartbeatPath !== 'string' || typeof marker.tempPath !== 'string') {
    throw new Error('external editor wrote an invalid readiness marker')
  }

  return marker
}

const waitForEditor = async (markerPath: string, context: ProcessContext, requests: RequestRecord[]): Promise<EditorMarker> => {
  const deadline = Date.now() + startupDeadlineMs
  while (Date.now() < deadline) {
    try {
      return await readMarker(markerPath)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }

    const result = await Promise.race([
      context.exit.then(exit => ({exit})),
      delay(25).then(() => ({waiting: true as const})),
    ])
    if ('exit' in result) {
      throw new Error(`CLI exited before editor readiness: exit=${String(result.exit.exitCode)} signal=${String(result.exit.signal)} error=${result.exit.error?.message ?? 'none'}`)
    }
  }

  throw new Error(`external editor did not become ready within ${startupDeadlineMs}ms; requests=${JSON.stringify(requests)}; CLI output: ${context.output}`)
}

const waitForPtyRecord = async <T>(context: ProcessContext, event: 'READY' | 'WAIT', timeoutMs = startupDeadlineMs): Promise<T> => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const lastNewline = context.stdout.lastIndexOf('\n')
    const completeLines = lastNewline === -1 ? [] : context.stdout.slice(0, lastNewline).split(/\r?\n/)
    const record = completeLines.find(line => line.startsWith(`${event} `))
    if (record) {
      try {
        return JSON.parse(record.slice(event.length + 1)) as T
      } catch (error) {
        throw new Error(`PTY harness emitted invalid ${event} record: ${String(error)}`)
      }
    }

    // eslint-disable-next-line no-await-in-loop
    const result = await Promise.race([
      context.exit.then(exit => ({exit})),
      delay(25).then(() => ({waiting: true as const})),
    ])
    if ('exit' in result) {
      const {error, exitCode, signal: exitSignal} = result.exit
      throw new Error(`PTY harness exited before ${event} record: exit=${String(exitCode)} signal=${String(exitSignal)} error=${error?.message ?? 'none'}; output=${context.output}`)
    }
  }

  throw new Error(`PTY harness did not emit ${event} within ${timeoutMs}ms; output=${context.output}`)
}

const isValidPtyReady = (record: PtyReady): boolean => Number.isSafeInteger(record.cliPid) && record.cliPid > 0

const isValidPtyWaitStatus = (record: PtyWaitStatus): boolean => Number.isSafeInteger(record.cliPid)
  && record.cliPid > 0
  && Number.isSafeInteger(record.waitStatus)
  && typeof record.signaled === 'boolean'
  && (record.signal === null || Number.isSafeInteger(record.signal))

const readOptionalEditorMarker = async (markerPath: string): Promise<EditorMarker | undefined> => {
  try {
    return await readMarker(markerPath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
}

const assertEditorPathRemoved = async (tempDir: string, markerPath: string): Promise<EditorMarker> => {
  const marker = await readMarker(markerPath)
  const resolvedTempDir = await realpath(tempDir)
  const resolvedEditorDir = await realpath(path.dirname(marker.tempPath))
  expect(
    resolvedEditorDir,
    `editor temp path must be inside the isolated HOME/TMPDIR: ${marker.tempPath}`,
  ).to.equal(resolvedTempDir)
  await waitForPidExit(marker.editorPid)
  expect(isProcessAlive(marker.editorPid), 'owned editor must exit before its tempfile is removed').to.equal(false)
  expect(existsSync(marker.tempPath), `editor temp file still exists: ${marker.tempPath}`).to.equal(false)

  const leftovers = (await readdir(tempDir)).filter(name => name.startsWith(editorTempPrefix))
  expect(leftovers, `config edit tempfiles remain: ${leftovers.join(', ')}`).to.deep.equal([])
  return marker
}

const makeEditorSource = (markerPath: string, heartbeatPath: string) => `#!${process.execPath}
import {renameSync, writeFileSync} from 'node:fs'

// A real terminal hangup also targets foreground-group members. Keep this
// owned editor alive so the CLI-owned tempfile can be checked before teardown.
process.on('SIGHUP', () => {})
const tempPath = process.argv[2]
const heartbeatStagingPath = ${JSON.stringify(heartbeatPath)} + '.tmp'
const writeHeartbeat = value => {
  writeFileSync(heartbeatStagingPath, String(value))
  renameSync(heartbeatStagingPath, ${JSON.stringify(heartbeatPath)})
}
let heartbeat = 0
writeHeartbeat(heartbeat)
const stagingPath = ${JSON.stringify(markerPath)} + '.tmp'
  writeFileSync(stagingPath, JSON.stringify({cliPid: process.ppid, editorPid: process.pid, heartbeatPath: ${JSON.stringify(heartbeatPath)}, tempPath}))
renameSync(stagingPath, ${JSON.stringify(markerPath)})
setInterval(() => writeHeartbeat(++heartbeat), 50)
`

const makeNetworkGuardSource = () => `
import net from 'node:net'
import tls from 'node:tls'
import {syncBuiltinESMExports} from 'node:module'

const allowedHosts = new Set(['127.0.0.1', '::1', 'localhost'])
const assertLocalHost = host => {
  if (!allowedHosts.has(host)) throw new Error('network-free config edit regression blocked a non-local network request')
}

const originalSocketConnect = net.Socket.prototype.connect
net.Socket.prototype.connect = function (...args) {
  const options = typeof args[0] === 'object' ? args[0] : {host: args[1]}
  assertLocalHost(options.host ?? options.hostname ?? 'localhost')
  return originalSocketConnect.apply(this, args)
}

const originalTlsConnect = tls.connect
tls.connect = function (options, ...args) {
  assertLocalHost(options.host ?? options.hostname ?? 'localhost')
  return originalTlsConnect.call(this, options, ...args)
}

const originalFetch = globalThis.fetch
globalThis.fetch = (input, ...args) => {
  const url = new URL(typeof input === 'string' ? input : input.url)
  assertLocalHost(url.hostname)
  return originalFetch(input, ...args)
}

syncBuiltinESMExports()
`

const buildEnvironment = (tempDir: string, host: string, editorPath: string, networkGuardPath: string): NodeJS.ProcessEnv => {
  const inherited: NodeJS.ProcessEnv = {}
  for (const name of ['LANG', 'LC_ALL', 'PATH', 'SystemRoot', 'WINDIR']) {
    if (process.env[name]) inherited[name] = process.env[name]
  }

  return {
    ...inherited,
    DISABLE_TELEMETRY: 'true',
    EDITOR: editorPath,
    FORCE_COLOR: '0',
    HEROKU_API_KEY: 'synthetic-heroku-api-key',
    HEROKU_HOST: host,
    HEROKU_SKIP_NEW_VERSION_CHECK: 'true',
    HOME: tempDir,
    HTTP_PROXY: '',
    http_proxy: '',
    HTTPS_PROXY: '',
    https_proxy: '',
    IS_HEROKU_TEST_ENV: 'true',
    NO_PROXY: '127.0.0.1,localhost',
    no_proxy: '127.0.0.1,localhost',
    NODE_OPTIONS: `--import=${JSON.stringify(networkGuardPath)}`,
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

// Keep setup, interruption, and cleanup together to make process ownership explicit.
// eslint-disable-next-line complexity
const runScenario = async (signal: NodeJS.Signals, usePty: boolean): Promise<Scenario> => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'heroku-config-edit-command-'))
  const editorPath = path.join(tempDir, 'fixture-editor.mjs')
  const markerPath = path.join(tempDir, 'editor-ready.json')
  const heartbeatPath = path.join(tempDir, 'editor-heartbeat')
  const networkGuardPath = path.join(tempDir, 'network-guard.mjs')
  const requests: RequestRecord[] = []
  const sockets = new Set<import('node:net').Socket>()
  const server = http.createServer((request, response) => {
    request.resume()
    request.once('end', () => {
      requests.push({method: request.method, url: request.url})
      const isInitialConfigGet = requests.length === 1 && request.method === 'GET' && request.url === configRoute
      if (isInitialConfigGet) {
        response.writeHead(200, {'content-type': 'application/json'})
        response.end(configBody)
        return
      }

      response.writeHead(404, {'content-type': 'application/json'})
      response.end(JSON.stringify({id: 'unexpected_request', message: 'Request not allowed in signal regression'}))
    })
  })
  server.on('connection', socket => {
    sockets.add(socket)
    socket.on('close', () => sockets.delete(socket))
  })

  let context: ProcessContext | undefined
  let marker: EditorMarker | undefined
  let result: ProcessExit | undefined
  let testError: unknown
  let cleanupError: unknown

  try {
    await Promise.all([
      writeFile(editorPath, makeEditorSource(markerPath, heartbeatPath)),
      writeFile(networkGuardPath, makeNetworkGuardSource()),
    ])
    await chmod(editorPath, 0o755)

    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('mock API did not expose its ephemeral TCP port')
    const env = buildEnvironment(tempDir, `http://127.0.0.1:${address.port}`, editorPath, networkGuardPath)

    context = observeProcess(spawn(
      usePty ? ptyPythonPath! : process.execPath,
      usePty ? ['-c', ptyHarnessSource, process.execPath, cliPath, 'config:edit', '--app=myapp'] : [cliPath, 'config:edit', '--app=myapp'],
      {
        cwd: cliRoot,
        env,
        stdio: usePty ? ['pipe', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe'],
      },
    ))

    const ptyReady = usePty ? await waitForPtyRecord<PtyReady>(context, 'READY') : undefined
    if (ptyReady && !isValidPtyReady(ptyReady)) throw new Error('PTY harness exposed an invalid CLI PID')

    marker = await waitForEditor(markerPath, context, requests)
    const resolvedTempDir = await realpath(tempDir)
    const resolvedEditorDir = await realpath(path.dirname(marker.tempPath))
    expect(
      resolvedEditorDir,
      `editor tempfile escaped isolated HOME/TMPDIR: ${marker.tempPath}`,
    ).to.equal(resolvedTempDir)
    expect(existsSync(marker.tempPath), 'generated tempfile must exist while the external editor is running').to.equal(true)
    expect(isProcessAlive(marker.editorPid), 'owned external editor must be live before interruption').to.equal(true)
    expect(requests, 'CLI must fetch the synthetic config before launching the editor').to.deep.equal([
      {method: 'GET', url: configRoute},
    ])

    if (usePty) {
      expect(ptyReady?.cliPid, 'Python PTY wrapper must expose the CLI child PID').to.equal(marker.cliPid)
      expect(isProcessAlive(ptyReady!.cliPid), 'PTY child CLI must be running before master closure').to.equal(true)
      expect(context.child.stdin?.write('CLOSE\n'), 'could not trigger PTY master closure').to.equal(true)
      const wrapperResult = await waitForExit(context.exit)
      await waitForProcessClose(context)
      const waitStatus = await waitForPtyRecord<PtyWaitStatus>(context, 'WAIT', exitDeadlineMs)
      expect(isValidPtyWaitStatus(waitStatus), 'Python wrapper must report a complete CLI wait status').to.equal(true)
      expect(wrapperResult.error, 'Python PTY wrapper must run successfully').to.equal(undefined)
      expect(wrapperResult.exitCode, 'Python PTY wrapper must report the reaped CLI status').to.equal(0)
      expect(waitStatus.cliPid, 'Python wrapper must report the CLI child it reaped').to.equal(ptyReady?.cliPid)
      expect(waitStatus.signaled, `PTY child must be signaled; raw wait status=${waitStatus.waitStatus}`).to.equal(true)
      expect(waitStatus.signal, `PTY child raw wait status=${waitStatus.waitStatus} must identify SIGHUP`).to.equal(os.constants.signals.SIGHUP)
      result = {exitCode: null, signal: 'SIGHUP'}
      await waitForPidExit(marker.editorPid)
      expect(isProcessAlive(marker.editorPid), 'PTY close must not leave the external editor running').to.equal(false)
    } else {
      expect(context.child.pid, 'CLI subprocess must have a PID').to.be.a('number')
      expect(context.child.kill(signal), `could not deliver parent-only ${signal}`).to.equal(true)
      result = await waitForExit(context.exit)
    }

    expect(result.error, 'CLI process must start successfully').to.equal(undefined)
    expect(result.exitCode, 'interrupted process must not exit normally').to.equal(null)
    expect(result.signal, 'subprocess must terminate with the expected controlled signal').to.equal(signal)

    // Verify editor exit and tempfile removal before teardown can mask a leak.
    marker = await assertEditorPathRemoved(tempDir, markerPath)
    expect(requests, 'interrupted edit must not verify or update config').to.deep.equal([
      {method: 'GET', url: configRoute},
    ])
  } catch (error) {
    testError = error
  } finally {
    try {
      marker ??= await readOptionalEditorMarker(markerPath)
    } catch (error) {
      cleanupError ??= error
    }

    try {
      if (marker) await stopOwnedPid(marker.editorPid)
    } catch (error) {
      cleanupError ??= error
    }

    try {
      await stopProcess(context, usePty)
    } catch (error) {
      cleanupError ??= error
    }

    for (const socket of sockets) socket.destroy()
    try {
      if (server.listening) {
        await new Promise<void>(resolve => server.close(() => resolve()))
      }
    } catch (error) {
      cleanupError ??= error
    }

    try {
      await rm(tempDir, {force: true, recursive: true})
    } catch (error) {
      cleanupError ??= error
    }
  }

  if (testError && cleanupError) throw new AggregateError([testError, cleanupError], 'signal regression and owned-process cleanup failed')
  if (cleanupError) throw cleanupError
  if (testError) throw testError
  if (!result) throw new Error('signal scenario did not capture the CLI exit result')
  return {requests, result}
}

const posixDescribe = process.platform === 'win32' ? describe.skip : describe
const ptyDescribe = process.platform === 'darwin' && ptyPythonPath ? describe : describe.skip

describe('config:edit full CLI signal cleanup', function () {
  this.timeout(90_000)

  posixDescribe('parent-only signals', function () {
    for (const signal of ['SIGINT', 'SIGHUP'] as const) {
      it(`removes the generated tempfile after CLI-only ${signal}`, async function () {
        const {requests, result} = await runScenario(signal, false)
        expect(result.exitCode).to.equal(null)
        expect(result.signal).to.equal(signal)
        expect(requests).to.deep.equal([{method: 'GET', url: configRoute}])
      })
    }
  })

  ptyDescribe('macOS PTY terminal close', function () {
    it('stops the editor and cleans up after Python closes the PTY master', async function () {
      const {requests, result} = await runScenario('SIGHUP', true)
      expect(result.exitCode).to.equal(null)
      expect(result.signal).to.equal('SIGHUP')
      expect(requests).to.deep.equal([{method: 'GET', url: configRoute}])
    })
  })
})
