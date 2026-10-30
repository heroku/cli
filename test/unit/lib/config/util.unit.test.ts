import {expect} from 'chai'
import fs from 'fs-extra'
import cp from 'node:child_process'
import {EventEmitter} from 'node:events'
import fsSync from 'node:fs'
import {syncBuiltinESMExports} from 'node:module'
import {setTimeout as nativeSetTimeout} from 'node:timers'
import * as sinon from 'sinon'
import tmp, {type FileOptions, type FileResult} from 'tmp'

import {Editor} from '../../../../src/lib/config/util.js'
import {awaitProcessShutdown} from '../../../../src/lib/process-shutdown.js'

const lifecycleEvents = ['SIGINT', 'SIGTERM', 'SIGHUP', 'exit'] as const
type LifecycleEvent = typeof lifecycleEvents[number]

interface TrackedFile {
  file: FileResult
  remove: () => void
}

const realFileSync = tmp.fileSync.bind(tmp) as (options?: FileOptions) => FileResult
const waitForImmediate = () => new Promise<void>(resolve => {
  setImmediate(resolve)
})

function makeChild() {
  // ChildProcess uses EventEmitter semantics, so mirror those in the fake.
  // eslint-disable-next-line unicorn/prefer-event-target
  return new EventEmitter()
}

function listenersFor(event: LifecycleEvent): unknown[] {
  return EventEmitter.prototype.listeners.call(process, event) as unknown[]
}

function captureListeners(): Record<LifecycleEvent, unknown[]> {
  return Object.fromEntries(lifecycleEvents.map(event => [event, listenersFor(event)])) as Record<LifecycleEvent, unknown[]>
}

function expectListenersToMatch(snapshot: Record<LifecycleEvent, unknown[]>) {
  for (const event of lifecycleEvents) {
    expect(listenersFor(event), `${event} listeners`).to.deep.equal(snapshot[event])
  }
}

async function rejectionOf(promise: Promise<unknown>) {
  const [result] = await Promise.allSettled([promise])
  expect(result.status, 'expected edit to reject').to.equal('rejected')
  return (result as PromiseRejectedResult).reason as Error
}

describe('config util Editor', function () {
  let spawnStub: sinon.SinonStub
  let tmpFileSyncStub: sinon.SinonStub
  let files: TrackedFile[]
  let listenerSnapshot: Record<LifecycleEvent, unknown[]>
  let unlinkOnAcquire: boolean
  let originalVisual: string | undefined
  let originalEditor: string | undefined

  beforeEach(function () {
    files = []
    unlinkOnAcquire = false
    listenerSnapshot = captureListeners()
    originalVisual = process.env.VISUAL
    originalEditor = process.env.EDITOR

    tmpFileSyncStub = sinon.stub(tmp, 'fileSync').callsFake((options = {}) => {
      const file = realFileSync(options)
      files.push({file, remove: file.removeCallback.bind(file)})
      if (unlinkOnAcquire) fs.unlinkSync(file.name)
      return file
    })
    spawnStub = sinon.stub(cp, 'spawn')

    // Keep named child_process imports (including the current implementation)
    // pointed at the stub; the production helper may use cp.spawn directly.
    syncBuiltinESMExports()
  })

  afterEach(async function () {
    await waitForImmediate()
    sinon.restore()
    syncBuiltinESMExports()

    if (originalVisual === undefined) delete process.env.VISUAL
    else process.env.VISUAL = originalVisual
    if (originalEditor === undefined) delete process.env.EDITOR
    else process.env.EDITOR = originalEditor

    for (const event of lifecycleEvents) {
      const remaining = listenersFor(event)
      const original = listenerSnapshot[event]
      for (const listener of remaining) {
        if (!original.includes(listener)) Reflect.apply(EventEmitter.prototype.removeListener, process, [event, listener])
      }
    }

    for (const {file, remove} of files) {
      try {
        remove()
      } catch {
        try {
          fs.unlinkSync(file.name)
        } catch {
          // The test may have already removed the path.
        }
      }
    }
  })

  it('writes input before spawning, reads edited UTF-8 before removal, and preserves editor precedence', async function () {
    const original = 'TOKEN=initial-value\n'
    const edited = 'TOKEN=updated-✓\n'
    process.env.EDITOR = 'editor-from-editor'
    process.env.VISUAL = 'editor-from-visual'
    const child = makeChild()
    let spawnedResolve!: () => void
    const spawned = new Promise<void>(resolve => {
      spawnedResolve = resolve
    })
    let editorPath = ''
    const readFileSpy = sinon.spy(fs, 'readFile')

    spawnStub.callsFake((_editor: string, args: string[], options: {stdio: string}) => {
      editorPath = args[0]
      expect(fs.readFileSync(editorPath, 'utf8')).to.equal(original)
      expect(options.stdio).to.equal('inherit')
      fs.writeFileSync(editorPath, edited, 'utf8')
      spawnedResolve()
      return child
    })

    const operation = new Editor().edit(original)
    await spawned
    const {file} = files[0]
    const remove = file.removeCallback.bind(file)
    let pathExistedOnCleanup = false
    const removeStub = sinon.stub(file, 'removeCallback').callsFake(() => {
      pathExistedOnCleanup = fs.existsSync(file.name)
      remove()
    })
    child.emit('exit', 0, null)
    child.emit('close', 0, null)
    const result = await operation

    expect(result).to.equal(edited)
    expect(spawnStub.calledOnce).to.be.true
    expect(spawnStub.firstCall.args[0]).to.equal('editor-from-visual')
    expect(pathExistedOnCleanup).to.be.true
    expect(removeStub.calledOnce).to.be.true
    expect(readFileSpy.calledBefore(removeStub)).to.be.true
    expect(fs.existsSync(editorPath)).to.be.false
    expectListenersToMatch(listenerSnapshot)
  })

  it('does not attempt cleanup when temporary-file acquisition fails', async function () {
    const acquisitionError = new Error('temporary file acquisition failed')
    tmpFileSyncStub.throws(acquisitionError)

    const error = await rejectionOf(new Editor().edit('config-value'))

    expect(error).to.equal(acquisitionError)
    expect(files).to.be.empty
    expect(spawnStub.called).to.be.false
    expectListenersToMatch(listenerSnapshot)
  })

  it('supports repeated edits without retaining lifecycle listeners or temp files', async function () {
    spawnStub.callsFake(() => {
      const child = makeChild()
      process.nextTick(() => {
        child.emit('exit', 0, null)
        child.emit('close', 0, null)
      })
      return child
    })

    const editor = new Editor()
    expect(await editor.edit('first-value')).to.equal('first-value')
    expect(await editor.edit('second-value')).to.equal('second-value')

    expect(files).to.have.length(2)
    expect(files.every(({file}) => !fs.existsSync(file.name))).to.be.true
    expect(spawnStub.calledTwice).to.be.true
    expectListenersToMatch(listenerSnapshot)
  })

  it('removes the acquired file when the initial descriptor write fails', async function () {
    const writeError = new Error('initial write failed')
    sinon.stub(fsSync, 'writeFileSync').throws(writeError)
    syncBuiltinESMExports()

    const error = await rejectionOf(new Editor().edit('initial-content'))

    expect(error).to.equal(writeError)
    expect(spawnStub.called).to.be.false
    expect(files).to.have.length(1)
    expect(fs.existsSync(files[0].file.name)).to.be.false
    expectListenersToMatch(listenerSnapshot)
  })

  it('writes synchronously by path when the temporary file descriptor is discarded', async function () {
    const input = 'CONFIG=value\n'
    const child = makeChild()
    const writeFileSpy = sinon.spy(fsSync, 'writeFileSync')
    syncBuiltinESMExports()
    spawnStub.callsFake((_editor: string, [editorPath]: string[]) => {
      expect(fs.readFileSync(editorPath, 'utf8')).to.equal(input)
      process.nextTick(() => {
        child.emit('exit', 0, null)
        child.emit('close', 0, null)
      })
      return child
    })

    const result = await new Editor().edit(input, {discardDescriptor: true})

    expect(result).to.equal(input)
    expect(files[0].file.fd).to.be.undefined
    expect(writeFileSpy.calledWith(files[0].file.name, input, 'utf8')).to.be.true
    expect(spawnStub.calledOnce).to.be.true
    expect(fs.existsSync(files[0].file.name)).to.be.false
    expectListenersToMatch(listenerSnapshot)
  })

  it('cleans up interruption during the initial write before spawning the editor', async function () {
    const owner = sinon.spy()
    const realWriteFileSync = fsSync.writeFileSync.bind(fsSync)
    let operation: Promise<string> | undefined
    let sentSignal = false
    let writeFileStub: sinon.SinonStub | undefined
    let killStub: sinon.SinonStub | undefined

    try {
      process.on('SIGINT', owner)
      writeFileStub = sinon.stub(fsSync, 'writeFileSync').callsFake((path, data, options) => {
        const result = realWriteFileSync(path, data, options)
        if (!sentSignal) {
          sentSignal = true
          const signalHandler = listenersFor('SIGINT').find(listener => listener !== owner && !listenerSnapshot.SIGINT.includes(listener)) as NodeJS.SignalsListener | undefined
          expect(signalHandler, 'helper-owned SIGINT listener').to.be.a('function')
          signalHandler?.call(process, 'SIGINT')
        }

        return result
      })
      syncBuiltinESMExports()
      killStub = sinon.stub(process, 'kill')
      operation = new Editor().edit('initial-content')
      const error = await rejectionOf(operation)

      expect(owner.notCalled).to.be.true
      expect(sentSignal).to.be.true
      expect(writeFileStub.calledOnce, 'interruption must not trigger a second write').to.be.true
      expect(error).to.be.instanceOf(Error)
      expect(error.message).to.equal('Editor interrupted by SIGINT')
      expect(killStub?.notCalled).to.be.true
      expect(spawnStub.called).to.be.false
      expect(files).to.have.length(1)
      expect(fs.existsSync(files[0].file.name)).to.be.false
      const afterFailure = captureListeners()
      expect(afterFailure.SIGINT).to.deep.equal([...listenerSnapshot.SIGINT, owner])
      expect(afterFailure.SIGTERM).to.deep.equal(listenerSnapshot.SIGTERM)
      expect(afterFailure.SIGHUP).to.deep.equal(listenerSnapshot.SIGHUP)
      expect(afterFailure.exit).to.deep.equal(listenerSnapshot.exit)
    } finally {
      if (operation) await Promise.allSettled([operation])
      process.removeListener('SIGINT', owner)
      sinon.restore()
      syncBuiltinESMExports()
    }

    expectListenersToMatch(listenerSnapshot)
  })

  it('cleans up interruption during temporary-file acquisition before spawning the editor', async function () {
    if (process.platform === 'win32') this.skip()

    const owner = sinon.spy()
    let operation: Promise<string> | undefined
    let writeFileSpy: sinon.SinonSpy | undefined
    let pathExistedAtSignal = false
    let ownedHandlers = captureListeners()

    try {
      writeFileSpy = sinon.spy(fsSync, 'writeFileSync')
      syncBuiltinESMExports()
      process.on('SIGTERM', owner)
      tmpFileSyncStub.callsFake((options = {}) => {
        const file = realFileSync(options)
        files.push({file, remove: file.removeCallback.bind(file)})
        ownedHandlers = Object.fromEntries(lifecycleEvents.map(event => [
          event,
          listenersFor(event).filter(listener => !listenerSnapshot[event].includes(listener) && listener !== owner),
        ])) as Record<LifecycleEvent, unknown[]>
        process.nextTick(() => {
          pathExistedAtSignal = fs.existsSync(file.name)
          process.kill(process.pid, 'SIGTERM')
        })
        return file
      })
      operation = new Editor().edit('initial-content')
      const error = await rejectionOf(operation)

      expect(error.message).to.equal('Editor interrupted by SIGTERM')
      expect(pathExistedAtSignal).to.be.true
      expect(owner.calledOnce).to.be.true
      expect(writeFileSpy?.notCalled, 'initial write must not run after interruption').to.be.true
      expect(spawnStub.called).to.be.false
      expect(files).to.have.length(1)
      expect(fs.existsSync(files[0].file.name)).to.be.false
      expect(listenersFor('SIGTERM')).to.include(owner)
      for (const event of lifecycleEvents) {
        for (const handler of ownedHandlers[event]) {
          expect(listenersFor(event), `${event} helper handler`).not.to.include(handler)
        }
      }
    } finally {
      if (operation) await Promise.allSettled([operation])
      process.removeListener('SIGTERM', owner)
      sinon.restore()
      syncBuiltinESMExports()
    }

    expect(listenersFor('SIGTERM')).not.to.include(owner)
    for (const event of lifecycleEvents) {
      for (const handler of ownedHandlers[event]) {
        expect(listenersFor(event), `${event} helper handler`).not.to.include(handler)
      }
    }
  })

  it('does not acquire a temporary file when interrupted during coordinator registration', async function () {
    const realPrependListener = process.prependListener
    let sentSignal = false
    let operation: Promise<string> | undefined
    let processPrependListenerStub: sinon.SinonStub | undefined
    let killStub: sinon.SinonStub | undefined
    let writeFileSpy: sinon.SinonSpy | undefined

    try {
      killStub = sinon.stub(process, 'kill')
      writeFileSpy = sinon.spy(fsSync, 'writeFileSync')
      syncBuiltinESMExports()
      processPrependListenerStub = sinon.stub(process, 'prependListener').callsFake((event, listener) => {
        const result = Reflect.apply(realPrependListener, process, [event, listener])
        if (String(event) === 'SIGHUP' && !sentSignal) {
          sentSignal = true
          process.emit('SIGHUP')
        }

        return result
      })
      operation = new Editor().edit('config-value')
      const error = await rejectionOf(operation)

      expect(sentSignal, 'signal fired after final handler registration').to.be.true
      expect(error.message).to.equal('Editor interrupted by SIGHUP')
      expect(tmpFileSyncStub.notCalled, 'temporary file must not be acquired after interruption').to.be.true
      expect(writeFileSpy?.notCalled, 'initial write must not run').to.be.true
      expect(spawnStub.notCalled, 'editor must not spawn').to.be.true
      expect(files).to.be.empty
    } finally {
      if (operation) await Promise.allSettled([operation])
      processPrependListenerStub?.restore()
      killStub?.restore()
      writeFileSpy?.restore()
      syncBuiltinESMExports()
    }

    expectListenersToMatch(listenerSnapshot)
  })

  it('rejects a synchronous spawn error and removes the temporary file', async function () {
    const spawnError = new Error('spawn failed')
    spawnStub.throws(spawnError)

    const error = await rejectionOf(new Editor().edit('config-value'))

    expect(error).to.equal(spawnError)
    expect(files).to.have.length(1)
    expect(fs.existsSync(files[0].file.name)).to.be.false
    expectListenersToMatch(listenerSnapshot)
  })

  it('rejects an asynchronous child error without waiting for an exit event', async function () {
    const spawnError = Object.assign(new Error('asynchronous spawn failed'), {code: 'ENOENT'})
    const child = makeChild()
    spawnStub.callsFake(() => {
      process.nextTick(() => child.emit('error', spawnError))
      return child
    })

    const operation = new Editor().edit('config-value')

    const error = await rejectionOf(operation)

    expect(error).to.equal(spawnError)
    expect(fs.existsSync(files[0].file.name)).to.be.false
    expectListenersToMatch(listenerSnapshot)
  })

  it('rejects a nonzero editor exit and removes the temporary file', async function () {
    const child = makeChild()
    spawnStub.callsFake(() => {
      process.nextTick(() => {
        child.emit('exit', 7, null)
        child.emit('close', 7, null)
      })
      return child
    })

    const error = await rejectionOf(new Editor().edit('config-value'))

    expect(error.message).to.contain('7')
    expect(fs.existsSync(files[0].file.name)).to.be.false
    expectListenersToMatch(listenerSnapshot)
  })

  it('reports a child termination signal instead of a null exit code', async function () {
    const child = makeChild()
    spawnStub.callsFake(() => {
      process.nextTick(() => {
        child.emit('exit', null, 'SIGTERM')
        child.emit('close', null, 'SIGTERM')
      })
      return child
    })

    const error = await rejectionOf(new Editor().edit('config-value'))

    expect(error.message).to.contain('SIGTERM')
    expect(error.message).not.to.contain('code null')
    expect(fs.existsSync(files[0].file.name)).to.be.false
    expectListenersToMatch(listenerSnapshot)
  })

  it('settles once when an asynchronous error is followed by close', async function () {
    const spawnError = new Error('editor launch failed')
    const child = makeChild()
    let spawnedResolve!: () => void
    const spawned = new Promise<void>(resolve => {
      spawnedResolve = resolve
    })
    spawnStub.callsFake(() => {
      spawnedResolve()
      return child
    })

    const operation = new Editor().edit('config-value')
    await spawned
    const {file} = files[0]
    const realRemove = file.removeCallback.bind(file)
    const removeStub = sinon.stub(file, 'removeCallback').callsFake(() => realRemove())
    child.emit('error', spawnError)
    child.emit('exit', 1, null)
    child.emit('close', 1, null)

    const error = await rejectionOf(operation)

    expect(error).to.equal(spawnError)
    expect(removeStub.calledOnce).to.be.true
    expect(child.listenerCount('error')).to.equal(0)
    expect(child.listenerCount('exit')).to.equal(0)
    expect(child.listenerCount('close')).to.equal(0)
    expect(fs.existsSync(file.name)).to.be.false
    expectListenersToMatch(listenerSnapshot)
  })

  it('removes the temporary file when reading the edited result fails', async function () {
    const child = makeChild()
    spawnStub.callsFake((_editor: string, [editorPath]: string[]) => {
      process.nextTick(() => {
        fs.unlinkSync(editorPath)
        child.emit('exit', 0, null)
        child.emit('close', 0, null)
      })
      return child
    })

    const error = await rejectionOf(new Editor().edit('config-value'))

    expect(error).to.be.instanceOf(Error)
    expect(fs.existsSync(files[0].file.name)).to.be.false
    expectListenersToMatch(listenerSnapshot)
  })

  it('returns edited content and warns when temporary-file cleanup fails', async function () {
    const edited = 'CONFIG=updated-value'
    const child = makeChild()
    let spawnedResolve!: () => void
    const spawned = new Promise<void>(resolve => {
      spawnedResolve = resolve
    })
    spawnStub.callsFake((_editor: string, [editorPath]: string[]) => {
      fs.writeFileSync(editorPath, edited, 'utf8')
      spawnedResolve()
      return child
    })
    const diagnostics: string[] = []
    sinon.stub(fsSync, 'writeSync').callsFake((_fd: number, chunk: string | Uint8Array) => {
      diagnostics.push(String(chunk))
      return Buffer.byteLength(String(chunk))
    })
    sinon.stub(fsSync, 'unlinkSync').throws(new Error('unlink failed'))
    syncBuiltinESMExports()

    const operation = new Editor().edit('CONFIG=initial-value')
    await spawned
    const {file} = files[0]
    sinon.stub(file, 'removeCallback').callsFake(() => {})
    child.emit('exit', 0, null)
    child.emit('close', 0, null)

    const result = await operation

    expect(result).to.equal(edited)
    expect(fs.existsSync(file.name)).to.be.true
    expect(diagnostics).to.deep.equal(['Failed to clean up temporary config file\n'])
    expectListenersToMatch(listenerSnapshot)
  })

  it('preserves editor failure and reports cleanup failure without config contents', async function () {
    const secret = 'CONFIG_SECRET_MUST_NOT_BE_LOGGED'
    const editorError = new Error('editor process failed')
    const cleanupError = new Error('unlink failed')
    const diagnostics: string[] = []
    const child = makeChild()
    let spawnedResolve!: () => void
    const spawned = new Promise<void>(resolve => {
      spawnedResolve = resolve
    })
    spawnStub.callsFake(() => {
      spawnedResolve()
      return child
    })
    sinon.stub(fsSync, 'writeSync').callsFake((_fd: number, chunk: string | Uint8Array) => {
      diagnostics.push(String(chunk))
      return Buffer.byteLength(String(chunk))
    })
    sinon.stub(fsSync, 'unlinkSync').throws(cleanupError)
    syncBuiltinESMExports()

    const operation = new Editor().edit(secret)
    await spawned
    const {file} = files[0]
    sinon.stub(file, 'removeCallback').throws(cleanupError)
    child.emit('error', editorError)
    child.emit('close', 1, null)

    const error = await rejectionOf(operation)
    const diagnosticText = diagnostics.join('\n')

    expect(error).to.equal(editorError)
    expect(diagnosticText).not.to.contain(secret)
    expect(diagnosticText).not.to.equal(error.message)
    expect(diagnostics).not.to.be.empty
    expect(fs.existsSync(file.name)).to.be.true
    expectListenersToMatch(listenerSnapshot)
  })

  it('uses the open descriptor so an unlinked path is not recreated by the initial write', async function () {
    if (process.platform === 'win32') this.skip()
    unlinkOnAcquire = true
    const child = makeChild()
    let pathStayedMissing = false
    spawnStub.callsFake((_editor: string, [editorPath]: string[]) => {
      pathStayedMissing = !fs.existsSync(editorPath)
      process.nextTick(() => {
        child.emit('exit', 0, null)
        child.emit('close', 0, null)
      })
      return child
    })

    const error = await rejectionOf(new Editor().edit('config-value'))

    expect(pathStayedMissing).to.be.true
    expect(error).to.be.instanceOf(Error)
    expect(fs.existsSync(files[0].file.name)).to.be.false
  })

  it('rejects interruption when an existing signal owner returns', async function () {
    const owner = sinon.spy()
    process.on('SIGINT', owner)
    const child = makeChild()
    let spawnedResolve!: () => void
    const spawned = new Promise<void>(resolve => {
      spawnedResolve = resolve
    })
    spawnStub.callsFake(() => {
      spawnedResolve()
      return child
    })

    const operation = new Editor().edit('config-value')
    await spawned
    const signalHandler = listenersFor('SIGINT').find(listener => listener !== owner && !listenerSnapshot.SIGINT.includes(listener)) as NodeJS.SignalsListener | undefined
    const killStub = sinon.stub(process, 'kill')

    const realListeners = process.listeners.bind(process)
    sinon.stub(process, 'listeners').callsFake(event => String(event) === 'SIGINT'
      ? [owner, signalHandler] as unknown as ReturnType<typeof process.listeners>
      : realListeners(event))
    if (signalHandler) {
      Reflect.apply(owner, process, ['SIGINT'])
      signalHandler.call(process, 'SIGINT')
    }

    child.emit('exit', 0, null)
    child.emit('close', 0, null)
    const [result] = await Promise.allSettled([operation])

    expect(signalHandler, 'helper-owned SIGINT listener').to.be.a('function')
    expect(owner.calledOnce).to.be.true
    expect(result.status, 'interrupted edit must not return config').to.equal('rejected')
    expect(killStub.called).to.be.false

    expect(process.listeners('SIGINT')).to.include(owner)
    expect(fs.existsSync(files[0].file.name)).to.be.false
    process.removeListener('SIGINT', owner)
  })

  it('kills and awaits the spawned editor before removing its temporary file on interruption', async function () {
    const owner = sinon.spy()
    const child = Object.assign(makeChild(), {
      exitCode: null as null | number,
      kill: sinon.stub().returns(true),
      signalCode: null as NodeJS.Signals | null,
    })
    let spawnedResolve!: () => void
    const spawned = new Promise<void>(resolve => {
      spawnedResolve = resolve
    })
    let operation: Promise<string> | undefined
    process.on('SIGINT', owner)
    spawnStub.callsFake(() => {
      spawnedResolve()
      return child
    })

    try {
      operation = new Editor().edit('config-value')
      const operationSettled = operation.then(() => true, () => true)
      await spawned
      const {file} = files[0]
      const signalHandler = listenersFor('SIGINT').find(listener => listener !== owner && !listenerSnapshot.SIGINT.includes(listener)) as NodeJS.SignalsListener | undefined

      expect(signalHandler, 'helper-owned SIGINT listener').to.be.a('function')
      signalHandler!.call(process, 'SIGINT')
      await waitForImmediate()

      expect(child.kill.calledOnceWith('SIGTERM'), 'interruption must request graceful editor termination').to.be.true
      expect(fs.existsSync(file.name), 'temporary file must remain while the editor process is still running').to.be.true

      const settledBeforeExit = await Promise.race([
        operationSettled,
        new Promise<boolean>(resolve => {
          setImmediate(() => resolve(false))
        }),
      ])
      expect(settledBeforeExit, 'edit must await editor termination').to.be.false

      child.exitCode = null
      child.signalCode = 'SIGTERM'
      child.emit('exit', null, 'SIGTERM')
      child.emit('close', null, 'SIGTERM')
      const error = await rejectionOf(operation)

      expect(error.message).to.equal('Editor interrupted by SIGINT')
      expect(fs.existsSync(file.name)).to.be.false
      expect(owner.notCalled).to.be.true
    } finally {
      child.emit('exit', null, 'SIGTERM')
      child.emit('close', null, 'SIGTERM')
      if (operation) await Promise.allSettled([operation])
      process.removeListener('SIGINT', owner)
    }

    expectListenersToMatch(listenerSnapshot)
  })

  it('cleans every concurrent edit before re-raising a signal exactly once', async function () {
    const children = [makeChild(), makeChild()].map(child => Object.assign(child, {
      exitCode: null as null | number,
      kill: sinon.stub().returns(true),
      signalCode: null as NodeJS.Signals | null,
    }))
    let spawnedCount = 0
    let spawnedResolve!: () => void
    const killRequests = children.map(() => {
      let resolve!: () => void
      const requested = new Promise<void>(res => {
        resolve = res
      })
      return {requested, resolve}
    })

    for (const [index, child] of children.entries()) {
      child.kill.callsFake(() => {
        killRequests[index].resolve()
        return true
      })
    }

    const spawned = new Promise<void>(resolve => {
      spawnedResolve = resolve
    })
    spawnStub.callsFake(() => {
      spawnedCount += 1
      if (spawnedCount === children.length) spawnedResolve()
      return children[spawnedCount - 1]
    })
    const killStub = sinon.stub(process, 'kill').callsFake(() => true)
    const realListeners = process.listeners.bind(process)
    const listenersStub = sinon.stub(process, 'listeners').callsFake(event => {
      if (String(event) !== 'SIGTERM') return realListeners(event)

      // Treat the coordinator as the only listener so ambient platform handlers
      // cannot change whether this test expects the signal to be re-raised.
      return listenersFor('SIGTERM').filter(listener => !listenerSnapshot.SIGTERM.includes(listener)) as unknown as ReturnType<typeof process.listeners>
    })
    const terminationTimeouts: NodeJS.Timeout[] = []
    const timeoutStub = sinon.stub(globalThis, 'setTimeout').callsFake((callback, delay, ...args) => {
      const timeout = nativeSetTimeout(callback, delay === 1000 ? 2_147_483_647 : delay, ...args)
      if (delay === 1000) terminationTimeouts.push(timeout)
      return timeout
    })

    const operations = [new Editor().edit('first-config'), new Editor().edit('second-config')]
    const settled = Promise.allSettled(operations)
    try {
      await spawned
      const signalHandlers = listenersFor('SIGTERM')
        .filter(listener => !listenerSnapshot.SIGTERM.includes(listener)) as NodeJS.SignalsListener[]

      expect(signalHandlers, 'active editors must share one coordinator listener').to.have.length(1)
      signalHandlers[0].call(process, 'SIGTERM')
      await Promise.all(killRequests.map(({requested}) => requested))

      expect(children.map(child => child.kill.args), 'each editor must receive one termination request')
        .to.deep.equal([[['SIGTERM']], [['SIGTERM']]])
      expect(files.map(({file}) => fs.existsSync(file.name)), 'all files must remain until each child exits').to.deep.equal([true, true])
      expect(await Promise.race([settled.then(() => true), waitForImmediate().then(() => false)]), 'edits must await both editor exits')
        .to.be.false
      expect(killStub.notCalled, 'signal must not be re-raised before all children exit').to.be.true

      children[0].exitCode = 0
      children[0].emit('exit', 0, null)
      children[0].emit('close', 0, null)
      await Promise.allSettled([operations[0]])

      expect(files[0] && fs.existsSync(files[0].file.name), 'first editor cleanup completes after its exit').to.be.false
      expect(files[1] && fs.existsSync(files[1].file.name), 'second editor remains active until its own exit').to.be.true
      expect(listenersFor('SIGTERM').filter(listener => !listenerSnapshot.SIGTERM.includes(listener)))
        .to.have.length(1, 'coordinator listener remains while one participant is registered')

      children[1].exitCode = 0
      children[1].emit('exit', 0, null)
      children[1].emit('close', 0, null)

      const results = await settled
      await waitForImmediate()

      expect(killStub.calledOnceWith(process.pid, 'SIGTERM')).to.be.true
      expect(files).to.have.length(2)
      expect(files.every(({file}) => !fs.existsSync(file.name))).to.be.true
      expect(results.map(result => result.status)).to.deep.equal(['rejected', 'rejected'])
      expect(results.map(result => (result as PromiseRejectedResult).reason.message))
        .to.deep.equal(['Editor interrupted by SIGTERM', 'Editor interrupted by SIGTERM'])
      expect(listenersFor('SIGTERM').filter(listener => !listenerSnapshot.SIGTERM.includes(listener)))
        .to.deep.equal([], 'coordinator listener is removed after the final participant unregisters')
    } finally {
      for (const child of children) {
        child.exitCode = 0
        child.emit('exit', 0, null)
        child.emit('close', 0, null)
      }

      await settled
      timeoutStub.restore()
      listenersStub.restore()
      for (const timeout of terminationTimeouts) clearTimeout(timeout)
    }

    expectListenersToMatch(listenerSnapshot)
  })

  it('defers a distinct signal during termination and re-raises it after cleanup when unowned', async function () {
    const child = Object.assign(makeChild(), {
      exitCode: null as null | number,
      kill: sinon.stub().returns(true),
      signalCode: null as NodeJS.Signals | null,
    })
    let spawnedResolve!: () => void
    const spawned = new Promise<void>(resolve => {
      spawnedResolve = resolve
    })
    spawnStub.callsFake(() => {
      spawnedResolve()
      return child
    })
    const redeliveredSignals: Array<{fileRemoved: boolean; signal: NodeJS.Signals}> = []
    const killStub = sinon.stub(process, 'kill').callsFake((_pid, signal) => {
      redeliveredSignals.push({fileRemoved: files.every(({file}) => !fs.existsSync(file.name)), signal: signal as NodeJS.Signals})
      return true
    })

    const operation = new Editor().edit('config-value')
    await spawned
    const sigtermHandler = listenersFor('SIGTERM')
      .find(listener => !listenerSnapshot.SIGTERM.includes(listener)) as NodeJS.SignalsListener | undefined
    const sighupHandler = listenersFor('SIGHUP')
      .find(listener => !listenerSnapshot.SIGHUP.includes(listener)) as NodeJS.SignalsListener | undefined
    const realListeners = process.listeners.bind(process)
    sinon.stub(process, 'listeners').callsFake(event => {
      const signal = String(event) as LifecycleEvent
      if (!['SIGHUP', 'SIGTERM'].includes(signal)) return realListeners(event)

      const coordinator = listenersFor(signal).find(listener => !listenerSnapshot[signal].includes(listener))
      return (coordinator ? [coordinator] : []) as unknown as ReturnType<typeof process.listeners>
    })

    expect(sigtermHandler, 'helper-owned SIGTERM listener').to.be.a('function')
    expect(sighupHandler, 'helper-owned SIGHUP listener').to.be.a('function')
    sigtermHandler!.call(process, 'SIGTERM')
    sighupHandler!.call(process, 'SIGHUP')
    await waitForImmediate()

    expect(child.kill.calledOnceWith('SIGTERM')).to.be.true
    expect(fs.existsSync(files[0].file.name), 'temporary file must remain while editor is alive').to.be.true
    await new Promise(resolve => {
      setImmediate(resolve)
    })
    expect(killStub.notCalled, 'neither signal may be re-raised before cleanup').to.be.true

    child.exitCode = 0
    child.emit('exit', 0, null)
    child.emit('close', 0, null)
    await rejectionOf(operation)
    await new Promise(resolve => {
      setImmediate(resolve)
    })

    expect(fs.existsSync(files[0].file.name)).to.be.false
    expect(redeliveredSignals.map(({signal}) => signal)).to.deep.equal(['SIGTERM', 'SIGHUP'])
    expect(redeliveredSignals.every(({fileRemoved}) => fileRemoved), 'every signal must be delivered again after cleanup').to.be.true
    expectListenersToMatch(listenerSnapshot)
  })

  it('retries direct cleanup on exit without rerunning the one-shot callback', async function () {
    const child = Object.assign(makeChild(), {
      exitCode: null as null | number,
      kill: sinon.stub().returns(true),
      signalCode: null as NodeJS.Signals | null,
    })
    let spawnedResolve!: () => void
    const spawned = new Promise<void>(resolve => {
      spawnedResolve = resolve
    })
    spawnStub.callsFake(() => {
      spawnedResolve()
      return child
    })
    const realUnlinkSync = fsSync.unlinkSync.bind(fsSync)
    let unlinkAttempts = 0
    let callbackAttempts = 0
    sinon.stub(process, 'kill').callsFake(() => true)
    sinon.stub(fsSync, 'writeSync').callsFake((_fd: number, chunk: string | Uint8Array) => Buffer.byteLength(String(chunk)))
    sinon.stub(fsSync, 'unlinkSync').callsFake((path: fsSync.PathLike) => {
      unlinkAttempts += 1
      if (unlinkAttempts === 1) throw new Error('transient unlink failure')
      return realUnlinkSync(path)
    })
    syncBuiltinESMExports()

    const operation = new Editor().edit('config-value')
    await spawned
    const {file} = files[0]
    sinon.stub(file, 'removeCallback').callsFake(() => {
      callbackAttempts += 1
      throw new Error('one-shot callback failure')
    })
    const signalHandler = listenersFor('SIGTERM').find(listener => !listenerSnapshot.SIGTERM.includes(listener)) as NodeJS.SignalsListener | undefined
    const exitListener = listenersFor('exit').find(listener => !listenerSnapshot.exit.includes(listener))

    const realListeners = process.listeners.bind(process)
    sinon.stub(process, 'listeners').callsFake(event => String(event) === 'SIGTERM'
      ? [signalHandler] as unknown as ReturnType<typeof process.listeners>
      : realListeners(event))
    expect(signalHandler, 'helper-owned SIGTERM listener').to.be.a('function')
    signalHandler!.call(process, 'SIGTERM')
    await waitForImmediate()
    expect(fs.existsSync(file.name)).to.be.true
    expect(unlinkAttempts, 'do not unlink while the editor can still use the file').to.equal(0)
    expect(callbackAttempts).to.equal(0)

    child.exitCode = 0
    child.emit('exit', 0, null)
    child.emit('close', 0, null)
    if (exitListener) (exitListener as (code: number) => void).call(process, 1)
    const error = await rejectionOf(operation)

    expect(exitListener, 'helper-owned exit listener').to.be.a('function')
    expect(error.message).to.equal('Editor interrupted by SIGTERM')
    expect(unlinkAttempts).to.be.greaterThan(1)
    expect(callbackAttempts).to.equal(1)
    expect(fs.existsSync(file.name)).to.be.false
    await awaitProcessShutdown('SIGTERM')
    expectListenersToMatch(listenerSnapshot)
  })

  it('best-effort force-kills without unlinking until child exit is confirmed', async function () {
    const child = Object.assign(makeChild(), {
      exitCode: null as null | number,
      kill: sinon.stub().returns(true),
      signalCode: null as NodeJS.Signals | null,
    })
    let spawnedResolve!: () => void
    const spawned = new Promise<void>(resolve => {
      spawnedResolve = resolve
    })
    spawnStub.callsFake(() => {
      spawnedResolve()
      return child
    })

    const operation = new Editor().edit('config-value')
    await spawned
    const {file} = files[0]
    const removeStub = sinon.spy(file, 'removeCallback')
    const diagnostics: string[] = []
    sinon.stub(fsSync, 'writeSync').callsFake((_fd: number, chunk: string | Uint8Array) => {
      diagnostics.push(String(chunk))
      return Buffer.byteLength(String(chunk))
    })
    syncBuiltinESMExports()
    const exitListener = listenersFor('exit').find(listener => !listenerSnapshot.exit.includes(listener))

    expect(exitListener, 'helper-owned exit listener').to.be.a('function')
    expect(fs.existsSync(file.name), 'temporary file exists while editor is alive').to.be.true
    if (exitListener) (exitListener as (code: number) => void).call(process, 1)
    expect(child.kill.calledOnceWith('SIGKILL'), 'exit event must request forced termination').to.be.true
    expect(removeStub.notCalled, 'an unconfirmed exit must not attempt synchronous cleanup').to.be.true
    expect(fs.existsSync(file.name), 'temporary file must remain until child exit is confirmed').to.be.true
    expect(diagnostics).to.deep.equal(['Could not confirm editor termination; temporary config file may remain\n'])

    // Simulate the child exit so the asynchronous edit can finish and clean up safely.
    child.exitCode = 0
    child.emit('exit', 0, null)
    child.emit('close', 0, null)
    await Promise.allSettled([operation])

    expect(removeStub.calledOnce, 'late child exit must not run cleanup twice').to.be.true
    expectListenersToMatch(listenerSnapshot)
  })

  it('leaves the temporary file when forced termination is not confirmed before timeout', async function () {
    const owner = sinon.spy()
    const child = Object.assign(makeChild(), {
      exitCode: null as null | number,
      kill: sinon.stub().returns(true),
      signalCode: null as NodeJS.Signals | null,
    })
    let spawnedResolve!: () => void
    const spawned = new Promise<void>(resolve => {
      spawnedResolve = resolve
    })
    let operation: Promise<string> | undefined
    let timeout: NodeJS.Timeout | undefined
    const testSetTimeout = globalThis.setTimeout
    globalThis.setTimeout = nativeSetTimeout
    process.on('SIGTERM', owner)
    spawnStub.callsFake(() => {
      spawnedResolve()
      return child
    })
    const processKillStub = sinon.stub(process, 'kill').callsFake(() => true)
    sinon.stub(fsSync, 'writeSync').callsFake((_fd: number, chunk: string | Uint8Array) => Buffer.byteLength(String(chunk)))
    syncBuiltinESMExports()

    try {
      operation = new Editor().edit('config-value')
      await spawned
      const {file} = files[0]
      const removeStub = sinon.spy(file, 'removeCallback')
      const signalHandler = listenersFor('SIGTERM')
        .find(listener => listener !== owner && !listenerSnapshot.SIGTERM.includes(listener)) as NodeJS.SignalsListener | undefined

      expect(signalHandler, 'helper-owned SIGTERM listener').to.be.a('function')
      signalHandler!.call(process, 'SIGTERM')
      await waitForImmediate()

      const outcome = operation.then(
        () => ({status: 'fulfilled' as const}),
        (error: Error) => ({error, status: 'rejected' as const}),
      )
      const boundedOutcome = await Promise.race([
        outcome,
        new Promise<{status: 'timeout'}>(resolve => {
          timeout = nativeSetTimeout(() => resolve({status: 'timeout'}), 2500)
        }),
      ])

      expect(boundedOutcome.status, 'edit must reject within the bounded termination timeout').to.equal('rejected')
      if (boundedOutcome.status === 'rejected') {
        expect(boundedOutcome.error.message).to.equal('Editor interrupted by SIGTERM')
      }

      await awaitProcessShutdown('SIGTERM')
      expect(child.kill.args, 'termination must escalate from graceful to forced').to.deep.equal([['SIGTERM'], ['SIGKILL']])
      expect(child.exitCode).to.be.null
      expect(child.signalCode).to.be.null
      expect(fs.existsSync(file.name), 'temporary file must remain until child exit is confirmed').to.be.true
      expect(processKillStub.notCalled, 'owned SIGTERM must not be re-raised').to.be.true
      expect(owner.notCalled).to.be.true
      expect(listenersFor('SIGTERM')).to.deep.equal([...listenerSnapshot.SIGTERM, owner])
      expect(listenersFor('SIGINT')).to.deep.equal(listenerSnapshot.SIGINT)
      expect(listenersFor('SIGHUP')).to.deep.equal(listenerSnapshot.SIGHUP)
      expect(listenersFor('exit')).to.deep.equal(listenerSnapshot.exit)

      child.exitCode = 0
      child.emit('exit', 0, null)
      child.emit('close', 0, null)

      expect(fs.existsSync(file.name), 'late child exit must remove the temporary file').to.be.false
      expect(child.listenerCount('error'), 'late child exit must remove error listeners').to.equal(0)
      expect(child.listenerCount('exit'), 'late child exit must remove exit listeners').to.equal(0)
      expect(child.listenerCount('close'), 'late child exit must remove close listeners').to.equal(0)
      expect(removeStub.calledOnce, 'late child exit must not duplicate cleanup callback').to.be.true
    } finally {
      if (timeout) clearTimeout(timeout)
      // A synthetic exit releases any still-pending termination wait if an assertion fails.
      child.exitCode = 0
      child.emit('exit', 0, null)
      child.emit('close', 0, null)
      if (operation) await Promise.allSettled([operation])
      for (const {file, remove} of files) {
        try {
          remove()
        } catch {
          try {
            fs.unlinkSync(file.name)
          } catch {
            // The path may already have been removed.
          }
        }
      }

      process.removeListener('SIGTERM', owner)
      globalThis.setTimeout = testSetTimeout
    }

    expectListenersToMatch(listenerSnapshot)
  })
})
