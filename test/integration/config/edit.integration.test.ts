import {expect} from 'chai'
import {spawn} from 'node:child_process'
import {existsSync} from 'node:fs'
import {
  chmod, mkdtemp, readdir, readFile, realpath, rm, writeFile,
} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {setTimeout as setNativeTimeout} from 'node:timers'
import {fileURLToPath, pathToFileURL} from 'node:url'

interface EditorMarker {
  editorPid: number
  ready: true
  tempPath: string
}

interface ChildResult {
  childError?: Error
  exitCode: null | number
  signal: NodeJS.Signals | null
  timedOut: boolean
}

interface ChildContext {
  child: ReturnType<typeof spawn>
  close: Promise<void>
  exit: Promise<Omit<ChildResult, 'timedOut'>>
}

interface ScenarioOptions {
  action?: 'process-exit' | 'uncaught-exception'
  enableTelemetry: boolean
  signal?: NodeJS.Signals
}

interface TelemetrySpawnRecord {
  args?: string[]
  command?: string
  kind: 'blocked-unexpected-spawn' | 'telemetry-worker-preload-block' | 'telemetry-worker-spawn'
  payload?: string
}

const cliRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const editorModuleUrl = pathToFileURL(path.join(cliRoot, 'dist/lib/config/util.js')).href
const telemetryModuleUrl = pathToFileURL(path.join(cliRoot, 'dist/lib/analytics-telemetry/worker-client.js')).href
const editorTempPrefix = 'heroku-config-edit-regression-'
const startupDeadlineMs = 8000
const exitDeadlineMs = 8000
const cleanupDeadlineMs = 2000

const delay = (ms: number) => new Promise(resolve => setNativeTimeout(resolve, ms))

const observeChild = (child: ReturnType<typeof spawn>): ChildContext => {
  let resolveExit = (_result: Omit<ChildResult, 'timedOut'>) => {}
  let resolveClose = () => {}
  const exit = new Promise<Omit<ChildResult, 'timedOut'>>(resolve => {
    resolveExit = resolve
  })
  const close = new Promise<void>(resolve => {
    resolveClose = resolve
  })

  child.once('error', childError => resolveExit({childError, exitCode: child.exitCode, signal: child.signalCode}))
  child.once('exit', (exitCode, signal) => resolveExit({exitCode, signal}))
  child.once('close', () => resolveClose())

  return {child, close, exit}
}

const waitForExit = async (exit: ChildContext['exit'], timeoutMs: number): Promise<ChildResult> => {
  let timeout: NodeJS.Timeout | undefined
  const result = await Promise.race([
    exit.then(value => ({value})),
    new Promise<{timeout: true}>(resolve => {
      timeout = setNativeTimeout(() => resolve({timeout: true}), timeoutMs)
    }),
  ])
  if (timeout) clearTimeout(timeout)
  if ('timeout' in result) return {exitCode: null, signal: null, timedOut: true}
  return {...result.value, timedOut: false}
}

const waitForClose = async (close: ChildContext['close'], timeoutMs: number): Promise<void> => {
  let timeout: NodeJS.Timeout | undefined
  const result = await Promise.race([
    close.then(() => ({closed: true as const})),
    new Promise<{timeout: true}>(resolve => {
      timeout = setNativeTimeout(() => resolve({timeout: true}), timeoutMs)
    }),
  ])
  if (timeout) clearTimeout(timeout)
  if ('timeout' in result) throw new Error(`fixture process did not close within ${timeoutMs}ms after exit`)
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

const waitForProcessExit = async (pid: number): Promise<void> => {
  const deadline = Date.now() + cleanupDeadlineMs
  while (Date.now() < deadline && isProcessAlive(pid)) await delay(25)
  if (isProcessAlive(pid)) throw new Error(`owned editor process ${pid} did not exit within ${cleanupDeadlineMs}ms`)
}

const stopEditor = async (pid: number | undefined): Promise<void> => {
  if (!pid || !isProcessAlive(pid)) return
  process.kill(pid, 'SIGTERM')
  const deadline = Date.now() + cleanupDeadlineMs
  while (Date.now() < deadline && isProcessAlive(pid)) await delay(25)
  if (isProcessAlive(pid)) {
    process.kill(pid, 'SIGKILL')
    await waitForProcessExit(pid)
  }
}

const stopChild = async (context: ChildContext | undefined): Promise<void> => {
  if (!context) return
  if (context.child.exitCode === null && context.child.signalCode === null) context.child.kill('SIGKILL')
  await waitForClose(context.close, cleanupDeadlineMs)
}

const readEditorMarker = async (markerPath: string): Promise<EditorMarker> => {
  const marker = JSON.parse(await readFile(markerPath, 'utf8')) as EditorMarker
  if (marker.ready !== true || !Number.isSafeInteger(marker.editorPid) || marker.editorPid <= 0 || typeof marker.tempPath !== 'string') {
    throw new Error(`invalid editor readiness marker: ${JSON.stringify(marker)}`)
  }

  return marker
}

const readTrackedEditorPid = async (pidPath: string): Promise<number | undefined> => {
  try {
    const pid = Number(await readFile(pidPath, 'utf8'))
    return Number.isSafeInteger(pid) && pid > 0 ? pid : undefined
  } catch {
    return undefined
  }
}

const readEditorPid = async (pidPath: string, markerPath: string): Promise<number | undefined> => {
  const trackedPid = await readTrackedEditorPid(pidPath)
  if (trackedPid) return trackedPid
  try {
    const marker = JSON.parse(await readFile(markerPath, 'utf8')) as Partial<EditorMarker>
    return Number.isSafeInteger(marker.editorPid) && marker.editorPid! > 0 ? marker.editorPid : undefined
  } catch {
    return undefined
  }
}

const waitForEditorPid = async (pidPath: string, markerPath: string, timeoutMs: number): Promise<number | undefined> => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const editorPid = await readEditorPid(pidPath, markerPath)
    if (editorPid) return editorPid
    await delay(25)
  }

  return readEditorPid(pidPath, markerPath)
}

const waitForTrackedEditorPid = async (pidPath: string, timeoutMs: number): Promise<number | undefined> => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const editorPid = await readTrackedEditorPid(pidPath)
    if (editorPid) return editorPid
    await delay(25)
  }

  return readTrackedEditorPid(pidPath)
}

const waitForEditorMarker = async (markerPath: string, exit: ChildContext['exit']): Promise<EditorMarker> => {
  const deadline = Date.now() + startupDeadlineMs
  while (Date.now() < deadline) {
    try {
      return await readEditorMarker(markerPath)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }

    const exited = await Promise.race([
      exit.then(result => ({result})),
      delay(25).then(() => ({waiting: true as const})),
    ])
    if ('result' in exited) {
      throw new Error(`fixture exited before editor readiness: exit=${String(exited.result.exitCode)} signal=${String(exited.result.signal)} error=${exited.result.childError?.message ?? 'none'}`)
    }
  }

  throw new Error(`editor readiness marker was not written within ${startupDeadlineMs}ms`)
}

const assertTempFileAbsent = async (tempDir: string, markerPath: string): Promise<EditorMarker | undefined> => {
  const resolvedTempDir = await realpath(tempDir)
  let marker: EditorMarker | undefined
  try {
    marker = await readEditorMarker(markerPath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }

  if (marker) {
    const relativePath = path.relative(resolvedTempDir, marker.tempPath)
    expect(relativePath === '' || relativePath.startsWith('..') || path.isAbsolute(relativePath), 'editor marker path must be inside the isolated temp directory').to.equal(false)
    expect(existsSync(marker.tempPath), `editor temp path still exists: ${marker.tempPath}`).to.equal(false)
  }

  const leftovers = (await readdir(tempDir)).filter(name => name.startsWith(editorTempPrefix))
  expect(leftovers, `editor temp files still exist: ${leftovers.join(', ')}`).to.deep.equal([])
  return marker
}

const makePreload = (recordPath: string, editorPidPath: string, editorScriptPath: string) => `
import childProcess from 'node:child_process'
import {
  appendFileSync, renameSync, writeFileSync,
} from 'node:fs'
import {syncBuiltinESMExports} from 'node:module'
import path from 'node:path'

const recordPath = ${JSON.stringify(recordPath)}
const editorPidPath = ${JSON.stringify(editorPidPath)}
const editorScriptPath = ${JSON.stringify(editorScriptPath)}
const editorTempPrefix = ${JSON.stringify(editorTempPrefix)}
const appendRecord = record => appendFileSync(recordPath, JSON.stringify(record) + '\\n')
const isTelemetryWorker = value => typeof value === 'string' && /(?:^|[\\\\/])telemetry-worker\\.js$/.test(value)

// Defense in depth: if spawn interception ever fails, the worker's own preload
// exits before its entrypoint can import telemetry clients or make network calls.
if (process.argv.some(isTelemetryWorker)) {
  appendRecord({kind: 'telemetry-worker-preload-block'})
  process.exit(0)
}

const editorTempPath = process.argv[1]
const isWindowsEditor = process.platform === 'win32' && typeof editorTempPath === 'string' &&
  editorTempPath.startsWith(process.env.TEST_TMPDIR + path.sep) &&
  path.basename(editorTempPath).startsWith(editorTempPrefix)
if (isWindowsEditor) {
  const markerPath = process.env.TEST_EDITOR_MARKER
  const markerTempPath = markerPath + '.tmp'
  writeFileSync(markerTempPath, JSON.stringify({ready: true, editorPid: process.pid, tempPath: editorTempPath}))
  renameSync(markerTempPath, markerPath)
  setInterval(() => {}, 1_000)
}

const originalSpawn = childProcess.spawn
const guardedSpawn = function (command, args, options) {
  const argv = Array.isArray(args) ? args : []
  if (argv.some(isTelemetryWorker)) {
    let payload = ''
    return {
      stdin: {
        write(chunk) {
          payload += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk)
          return true
        },
        end() {
          appendRecord({kind: 'telemetry-worker-spawn', command: String(command), args: argv.map(String), payload})
        },
      },
      unref() {},
    }
  }

  const isEditor = command === editorScriptPath || (
    process.platform === 'win32' && command === process.execPath && argv.length === 1 &&
    typeof argv[0] === 'string' && argv[0].startsWith(process.env.TEST_TMPDIR + path.sep) &&
    path.basename(argv[0]).startsWith(editorTempPrefix)
  )
  if (isEditor) {
    const editor = originalSpawn.call(childProcess, command, args, options)
    if (Number.isSafeInteger(editor.pid) && editor.pid > 0) writeFileSync(editorPidPath, String(editor.pid))
    return editor
  }
  appendRecord({kind: 'blocked-unexpected-spawn', command: String(command), args: argv.map(String)})
  throw new Error('network-free subprocess fixture blocked an unapproved spawn')
}

childProcess.spawn = guardedSpawn
syncBuiltinESMExports()
const esmChildProcess = await import('node:child_process')
if (childProcess.spawn !== guardedSpawn || esmChildProcess.spawn !== guardedSpawn) {
  throw new Error('could not prove child_process ESM spawn export uses the fail-closed interceptor')
}
`

const fixtureSource = `
import {existsSync} from 'node:fs'
import {Editor} from ${JSON.stringify(editorModuleUrl)}

const telemetry = await import(${JSON.stringify(telemetryModuleUrl)})
telemetry.setupTelemetryHandlers({
  cliStartTime: Date.now(),
  computeDuration: startTime => Date.now() - startTime,
  enableTelemetry: process.env.TEST_TELEMETRY_ENABLED === 'true',
})

const action = process.env.TEST_EXIT_ACTION
if (action) {
  const triggerPath = process.env.TEST_TRIGGER_PATH
  const timer = setInterval(() => {
    if (!existsSync(triggerPath)) return
    clearInterval(timer)
    if (action === 'process-exit') process.exit(23)
    if (action === 'uncaught-exception') throw new Error('synthetic uncaught exception')
  }, 10)
}

const editorInput = process.platform === 'win32' ? '// Windows editor fixture is held open by the preload' : 'SYNTHETIC_CONFIG=value'
await new Editor().edit(editorInput, {
  prefix: ${JSON.stringify(editorTempPrefix)},
  dir: process.env.TEST_TMPDIR,
})
`

const editorSource = `#!/usr/bin/env node
import {renameSync, writeFileSync} from 'node:fs'

const tempPath = process.argv[2]
const markerPath = process.env.TEST_EDITOR_MARKER
const markerTempPath = markerPath + '.tmp'
writeFileSync(markerTempPath, JSON.stringify({ready: true, editorPid: process.pid, tempPath}))
renameSync(markerTempPath, markerPath)
setInterval(() => {}, 1_000)
`

const buildChildEnvironment = (
  tempDir: string,
  editorScriptPath: string,
  markerPath: string,
  telemetryRecordPath: string,
  preloadPath: string,
  options: ScenarioOptions,
): NodeJS.ProcessEnv => ({
  EDITOR: process.platform === 'win32' ? process.execPath : editorScriptPath,
  HOME: tempDir,
  NODE_OPTIONS: `--import=${JSON.stringify(preloadPath)}`,
  PATH: process.env.PATH,
  TEMP: tempDir,
  TEST_EDITOR_MARKER: markerPath,
  TEST_EXIT_ACTION: options.action,
  TEST_TELEMETRY_ENABLED: String(options.enableTelemetry),
  TEST_TELEMETRY_RECORD: telemetryRecordPath,
  TEST_TMPDIR: tempDir,
  TEST_TRIGGER_PATH: path.join(tempDir, 'terminate-fixture'),
  TMP: tempDir,
  TMPDIR: tempDir,
  USERPROFILE: tempDir,
})

const runScenario = async (options: ScenarioOptions) => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'heroku-config-edit-signal-'))
  const editorScriptPath = path.join(tempDir, 'fixture-editor.mjs')
  const markerPath = path.join(tempDir, 'editor-ready.json')
  const editorPidPath = path.join(tempDir, 'editor.pid')
  const telemetryRecordPath = path.join(tempDir, 'telemetry-spawns.jsonl')
  const preloadPath = path.join(tempDir, 'fail-closed-preload.mjs')
  const triggerPath = path.join(tempDir, 'terminate-fixture')

  let child: ReturnType<typeof spawn> | undefined
  let childContext: ChildContext | undefined
  let marker: EditorMarker | undefined
  let childResult: ChildResult | undefined
  let records: TelemetrySpawnRecord[] = []
  let testError: unknown
  let cleanupError: unknown

  try {
    await writeFile(editorScriptPath, editorSource)
    await chmod(editorScriptPath, 0o755)
    await writeFile(telemetryRecordPath, '')
    await writeFile(preloadPath, makePreload(telemetryRecordPath, editorPidPath, editorScriptPath))

    child = spawn(process.execPath, ['--eval', fixtureSource], {
      cwd: cliRoot,
      env: buildChildEnvironment(tempDir, editorScriptPath, markerPath, telemetryRecordPath, preloadPath, options),
      // The editor inherits these descriptors. Avoid pipes here so its lifetime
      // cannot hold the CLI's close event open after the CLI has exited.
      stdio: 'ignore',
    })
    childContext = observeChild(child)
    marker = await waitForEditorMarker(markerPath, childContext.exit)
    expect(existsSync(markerPath), 'editor readiness marker must exist after editor startup').to.equal(true)
    const relativeTempPath = path.relative(await realpath(tempDir), marker.tempPath)
    expect(
      relativeTempPath !== '' && !relativeTempPath.startsWith('..') && !path.isAbsolute(relativeTempPath),
      `editor temp file must be isolated under the scenario directory: ${marker.tempPath}`,
    ).to.equal(true)
    expect(marker.editorPid).to.not.equal(child.pid)
    expect(await waitForTrackedEditorPid(editorPidPath, cleanupDeadlineMs), 'spawn interceptor must record the owned editor PID').to.equal(marker.editorPid)
    expect(existsSync(marker.tempPath), `editor temp file must exist before signaling: ${marker.tempPath}`).to.equal(true)
    expect(isProcessAlive(marker.editorPid), 'editor fixture must be alive before signaling').to.equal(true)

    if (options.signal) {
      expect(child.kill(options.signal), `could not signal owned fixture with ${options.signal}`).to.equal(true)
    } else {
      await writeFile(triggerPath, '')
    }

    childResult = await waitForExit(childContext.exit, exitDeadlineMs)
    expect(childResult.timedOut, 'fixture process exceeded its bounded exit deadline').to.equal(false)
    marker = await readEditorMarker(markerPath)

    // Check the tracked path while its editor is still alive, before cleanup kills
    // either owned process or removes the isolated directory.
    expect(isProcessAlive(marker.editorPid), 'editor fixture must still be alive for the cleanup assertion').to.equal(true)
    await assertTempFileAbsent(tempDir, markerPath)
    await waitForClose(childContext.close, cleanupDeadlineMs)

    records = (await readFile(telemetryRecordPath, 'utf8'))
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line) as TelemetrySpawnRecord)

    expect(records.filter(record => record.kind === 'blocked-unexpected-spawn'), 'fixture attempted an unapproved subprocess').to.deep.equal([])
  } catch (error) {
    testError = error
  } finally {
    try {
      // Keep this check ahead of every forced process termination and directory removal.
      await assertTempFileAbsent(tempDir, markerPath)
    } catch (error) {
      cleanupError ??= error
    }

    try {
      marker ??= await readEditorMarker(markerPath)
    } catch {
      // A failed scenario can exit before the full marker is readable. The
      // PID-only fallback below still reaps an editor that already started.
    }

    let editorPid = marker?.editorPid ?? await readEditorPid(editorPidPath, markerPath)
    if (!editorPid && childContext) {
      // Stop the fixture first, then allow an already-spawned editor to
      // publish its PID before removing the scenario directory.
      try {
        await stopChild(childContext)
      } catch (error) {
        cleanupError ??= error
      }

      editorPid = await waitForEditorPid(editorPidPath, markerPath, cleanupDeadlineMs)
    }

    try {
      await stopEditor(editorPid)
    } catch (error) {
      cleanupError ??= error
    }

    try {
      await stopChild(childContext)
    } catch (error) {
      cleanupError ??= error
    }

    try {
      await rm(tempDir, {force: true, recursive: true})
    } catch (error) {
      cleanupError ??= error
    }
  }

  if (testError && cleanupError) throw new AggregateError([testError, cleanupError], `scenario and cleanup failed: ${String(testError)}; ${String(cleanupError)}`)
  if (cleanupError) throw cleanupError
  if (testError) throw testError
  if (!childResult) throw new Error('fixture process did not produce a result')
  return {childResult, records}
}

const posixDescribe = process.platform === 'win32' ? describe.skip : describe

describe('config:edit subprocess cleanup', function () {
  this.timeout(30_000)

  posixDescribe('POSIX signal cleanup', function () {
    for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
      it(`removes the editor temp file after telemetry-disabled ${signal}`, async function () {
        const {childResult, records} = await runScenario({enableTelemetry: false, signal})
        expect(childResult.exitCode).to.equal(null)
        expect(childResult.signal).to.equal(signal)
        expect(records.filter(record => record.kind === 'telemetry-worker-spawn')).to.deep.equal([])
      })
    }

    for (const signal of ['SIGINT', 'SIGTERM'] as const) {
      it(`removes the editor temp file through enabled telemetry ${signal} handling`, async function () {
        const {childResult, records} = await runScenario({enableTelemetry: true, signal})
        expect(childResult.exitCode).to.equal(1)
        expect(childResult.signal).to.equal(null)
        expect(records.filter(record => record.kind === 'telemetry-worker-spawn')).to.have.length(1)

        const payloadRecord = records.find(record => record.kind === 'telemetry-worker-spawn' && record.payload)
        if (!payloadRecord || typeof payloadRecord.payload !== 'string') {
          throw new Error('telemetry handler must serialize its worker payload')
        }

        expect(payloadRecord.command).to.equal(process.execPath)
        expect(payloadRecord.args).to.have.length(1)
        expect(path.basename(payloadRecord.args![0])).to.equal('telemetry-worker.js')
        const envelope = JSON.parse(payloadRecord.payload) as {payload: {_type?: string; message?: string;}}
        expect(envelope.payload).to.include({_type: 'error', message: `Received ${signal}`})
        expect(records.some(record => record.kind === 'telemetry-worker-preload-block')).to.equal(false)
      })
    }
  })

  it('removes the editor temp file on explicit process.exit', async function () {
    const {childResult} = await runScenario({action: 'process-exit', enableTelemetry: false})
    expect(childResult.exitCode).to.equal(23)
    expect(childResult.signal).to.equal(null)
  })

  it('removes the editor temp file on ordinary uncaught-exception exit', async function () {
    const {childResult} = await runScenario({action: 'uncaught-exception', enableTelemetry: false})
    expect(childResult.exitCode).to.equal(1)
    expect(childResult.signal).to.equal(null)
  })
})
