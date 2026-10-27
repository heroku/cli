import {expect} from 'chai'
import fs from 'fs-extra'
import cp from 'node:child_process'
import {EventEmitter} from 'node:events'
import fsSync from 'node:fs'
import {syncBuiltinESMExports} from 'node:module'
import * as sinon from 'sinon'
import tmp, {type FileOptions, type FileResult} from 'tmp'

import {Editor} from '../../../../src/lib/config/util.js'

const lifecycleEvents = ['SIGINT', 'SIGTERM', 'SIGHUP', 'exit'] as const
type LifecycleEvent = typeof lifecycleEvents[number]

interface TrackedFile {
  file: FileResult
  remove: () => void
}

const realFileSync = tmp.fileSync.bind(tmp) as (options?: FileOptions) => FileResult

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

  afterEach(function () {
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
    let editorPath = ''
    const readFileSpy = sinon.spy(fs, 'readFile')

    spawnStub.callsFake((_editor: string, args: string[], options: {stdio: string}) => {
      editorPath = args[0]
      expect(fs.readFileSync(editorPath, 'utf8')).to.equal(original)
      expect(options.stdio).to.equal('inherit')
      fs.writeFileSync(editorPath, edited, 'utf8')
      process.nextTick(() => {
        child.emit('exit', 0, null)
        child.emit('close', 0, null)
      })
      return child
    })

    const operation = new Editor().edit(original)
    const {file} = files[0]
    const remove = file.removeCallback.bind(file)
    let pathExistedOnCleanup = false
    const removeStub = sinon.stub(file, 'removeCallback').callsFake(() => {
      pathExistedOnCleanup = fs.existsSync(file.name)
      remove()
    })
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
    const realPrependListener = process.prependListener
    let sentSignal = false
    process.on('SIGINT', owner)
    sinon.stub(process, 'prependListener').callsFake((event, listener) => {
      Reflect.apply(realPrependListener, process, [event, listener])
      if (String(event) === 'SIGINT' && !sentSignal) {
        sentSignal = true
        process.emit('SIGINT')
      }

      return process
    })

    const error = await rejectionOf(new Editor().edit('initial-content'))

    expect(owner.calledOnce).to.be.true
    expect(error).to.be.instanceOf(Error)
    expect(error.message).to.equal('Editor interrupted by SIGINT')
    expect(spawnStub.called).to.be.false
    expect(fs.existsSync(files[0].file.name)).to.be.false
    const afterFailure = captureListeners()
    expect(afterFailure.SIGINT).to.deep.equal([...listenerSnapshot.SIGINT, owner])
    expect(afterFailure.SIGTERM).to.deep.equal(listenerSnapshot.SIGTERM)
    expect(afterFailure.SIGHUP).to.deep.equal(listenerSnapshot.SIGHUP)
    expect(afterFailure.exit).to.deep.equal(listenerSnapshot.exit)
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
    spawnStub.callsFake(() => {
      process.nextTick(() => {
        child.emit('error', spawnError)
        child.emit('exit', 1, null)
        child.emit('close', 1, null)
      })
      return child
    })

    const operation = new Editor().edit('config-value')
    const {file} = files[0]
    const realRemove = file.removeCallback.bind(file)
    const removeStub = sinon.stub(file, 'removeCallback').callsFake(() => realRemove())

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

  it('rejects successful editing when temporary-file cleanup fails', async function () {
    const secret = 'CONFIG_SECRET_MUST_NOT_BE_LOGGED'
    const child = makeChild()
    spawnStub.callsFake((_editor: string, [editorPath]: string[]) => {
      fs.writeFileSync(editorPath, secret, 'utf8')
      process.nextTick(() => {
        child.emit('exit', 0, null)
        child.emit('close', 0, null)
      })
      return child
    })

    const operation = new Editor().edit(secret)
    const {file} = files[0]
    sinon.stub(file, 'removeCallback').throws(new Error('callback rejected'))
    sinon.stub(fsSync, 'unlinkSync').throws(new Error('unlink failed'))
    syncBuiltinESMExports()

    const error = await rejectionOf(operation)

    expect(error).to.be.instanceOf(Error)
    expect(fs.existsSync(file.name)).to.be.true
    expect(error.message).not.to.contain(secret)
    expectListenersToMatch(listenerSnapshot)
  })

  it('preserves editor failure and reports cleanup failure without config contents', async function () {
    const secret = 'CONFIG_SECRET_MUST_NOT_BE_LOGGED'
    const editorError = new Error('editor process failed')
    const cleanupError = new Error('unlink failed')
    const diagnostics: string[] = []
    const child = makeChild()
    spawnStub.callsFake(() => {
      process.nextTick(() => {
        child.emit('error', editorError)
        child.emit('close', 1, null)
      })
      return child
    })
    sinon.stub(fsSync, 'writeSync').callsFake((_fd: number, chunk: string | Uint8Array) => {
      diagnostics.push(String(chunk))
      return Buffer.byteLength(String(chunk))
    })
    sinon.stub(fsSync, 'unlinkSync').throws(cleanupError)
    syncBuiltinESMExports()

    const operation = new Editor().edit(secret)
    const {file} = files[0]
    sinon.stub(file, 'removeCallback').throws(cleanupError)

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
    const signalHandler = listenersFor('SIGINT').find(listener => listener !== owner && !listenerSnapshot.SIGINT.includes(listener))
    const killStub = sinon.stub(process, 'kill')

    if (signalHandler) process.emit('SIGINT')
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

  it('cleans every concurrent edit before re-raising a signal exactly once', async function () {
    const children = [makeChild(), makeChild()]
    let spawnedCount = 0
    let spawnedResolve!: () => void
    const spawned = new Promise<void>(resolve => {
      spawnedResolve = resolve
    })
    spawnStub.callsFake(() => {
      spawnedCount += 1
      if (spawnedCount === children.length) spawnedResolve()
      return children[spawnedCount - 1]
    })
    const killStub = sinon.stub(process, 'kill').callsFake(() => true)

    const operations = [new Editor().edit('first-config'), new Editor().edit('second-config')]
    await spawned
    process.emit('SIGTERM')
    const results = await Promise.allSettled(operations)

    expect(killStub.calledOnceWith(process.pid, 'SIGTERM')).to.be.true
    expect(files).to.have.length(2)
    expect(files.every(({file}) => !fs.existsSync(file.name))).to.be.true
    expect(results.map(result => result.status)).to.deep.equal(['rejected', 'rejected'])
    expect(results.map(result => (result as PromiseRejectedResult).reason.message))
      .to.deep.equal(['Editor interrupted by SIGTERM', 'Editor interrupted by SIGTERM'])
    expectListenersToMatch(listenerSnapshot)
  })

  it('retries direct cleanup on exit without rerunning the one-shot callback', async function () {
    const child = makeChild()
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
    const exitListener = listenersFor('exit').find(listener => !listenerSnapshot.exit.includes(listener))

    process.emit('SIGTERM')
    expect(fs.existsSync(file.name)).to.be.true
    expect(unlinkAttempts).to.equal(1)
    expect(callbackAttempts).to.equal(1)
    if (exitListener) (exitListener as (code: number) => void).call(process, 1)
    const error = await rejectionOf(operation)

    expect(exitListener, 'helper-owned exit listener').to.be.a('function')
    expect(error.message).to.equal('Editor interrupted by SIGTERM')
    expect(unlinkAttempts).to.be.greaterThan(1)
    expect(callbackAttempts).to.equal(1)
    expect(fs.existsSync(file.name)).to.be.false
    expectListenersToMatch(listenerSnapshot)
  })

  it('synchronously removes the temporary path from its owned exit listener', async function () {
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
    const exitListener = listenersFor('exit').find(listener => !listenerSnapshot.exit.includes(listener))

    if (exitListener) (exitListener as (code: number) => void).call(process, 1)
    const removedBeforeChildClose = !fs.existsSync(files[0].file.name)
    child.emit('exit', 0, null)
    child.emit('close', 0, null)
    await Promise.allSettled([operation])

    expect(exitListener, 'helper-owned exit listener').to.be.a('function')
    expect(removedBeforeChildClose).to.be.true
    expectListenersToMatch(listenerSnapshot)
  })
})
