import {expect} from 'chai'
import childProcess from 'node:child_process'
import {EventEmitter} from 'node:events'
import {syncBuiltinESMExports} from 'node:module'
import * as sinon from 'sinon'

import {setupTelemetryHandlers} from '../../../src/lib/analytics-telemetry/worker-client.js'
import {registerShutdownParticipant, type ShutdownSignal} from '../../../src/lib/process-shutdown.js'

const shutdownSignals = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const
type Signal = typeof shutdownSignals[number]

function listenersFor(signal: Signal): unknown[] {
  return EventEmitter.prototype.listeners.call(process, signal) as unknown[]
}

function deferred<T = void>() {
  let resolve!: (value: PromiseLike<T> | T) => void
  const promise = new Promise<T>(res => {
    resolve = res
  })

  return {promise, resolve}
}

const waitForImmediate = () => new Promise<void>(resolve => {
  setImmediate(resolve)
})

describe('telemetry worker client', function () {
  let sandbox: sinon.SinonSandbox
  let originalListeners: Record<Signal, unknown[]>
  let originalCliTelemetry: PropertyDescriptor | undefined
  let originalTelemetrySent: PropertyDescriptor | undefined
  let originalStdinIsTTY: PropertyDescriptor | undefined
  let unregisterParticipants: Array<() => void>
  let deferredCompletions: Array<{resolve: (value?: void) => void}>
  let originalListenersBeforeExit: unknown[]

  beforeEach(function () {
    sandbox = sinon.createSandbox()
    originalListeners = Object.fromEntries(shutdownSignals.map(signal => [signal, listenersFor(signal)])) as Record<Signal, unknown[]>
    originalListenersBeforeExit = EventEmitter.prototype.listeners.call(process, 'beforeExit') as unknown[]
    originalCliTelemetry = Object.getOwnPropertyDescriptor(globalThis, 'cliTelemetry')
    originalTelemetrySent = Object.getOwnPropertyDescriptor(globalThis, 'telemetrySent')
    originalStdinIsTTY = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY')
    unregisterParticipants = []
    deferredCompletions = []
    Reflect.deleteProperty(globalThis, 'cliTelemetry')
    Reflect.deleteProperty(globalThis, 'telemetrySent')
  })

  afterEach(async function () {
    for (const completion of deferredCompletions) completion.resolve()
    for (const unregister of unregisterParticipants) unregister()
    await waitForImmediate()
    await waitForImmediate()

    for (const signal of shutdownSignals) {
      for (const listener of listenersFor(signal)) {
        if (!originalListeners[signal].includes(listener)) Reflect.apply(EventEmitter.prototype.removeListener, process, [signal, listener])
      }
    }

    for (const listener of EventEmitter.prototype.listeners.call(process, 'beforeExit') as unknown[]) {
      if (!originalListenersBeforeExit.includes(listener)) Reflect.apply(EventEmitter.prototype.removeListener, process, ['beforeExit', listener])
    }

    if (originalStdinIsTTY) {
      Object.defineProperty(process.stdin, 'isTTY', originalStdinIsTTY)
    } else {
      Reflect.deleteProperty(process.stdin, 'isTTY')
    }

    if (originalCliTelemetry) Reflect.defineProperty(globalThis, 'cliTelemetry', originalCliTelemetry)
    else Reflect.deleteProperty(globalThis, 'cliTelemetry')
    if (originalTelemetrySent) Reflect.defineProperty(globalThis, 'telemetrySent', originalTelemetrySent)
    else Reflect.deleteProperty(globalThis, 'telemetrySent')

    sandbox.restore()
    syncBuiltinESMExports()
  })

  function registerDeferredParticipant(signal: ShutdownSignal) {
    const started = deferred<void>()
    const completion = deferred<void>()
    deferredCompletions.push(completion)
    unregisterParticipants.push(registerShutdownParticipant(async receivedSignal => {
      if (receivedSignal !== signal) return
      started.resolve()
      await completion.promise
    }))

    return {completion, started}
  }

  function stubWorkerSpawn(order: string[] = []) {
    const write = sandbox.stub()
    const end = sandbox.stub()
    const unref = sandbox.stub()
    const fakeSpawn = (() => {
      order.push('spawn')
      return {stdin: {end, write}, unref} as unknown as ReturnType<typeof childProcess.spawn>
    }) as typeof childProcess.spawn
    const spawn = sandbox.stub(childProcess, 'spawn').callsFake(fakeSpawn)
    syncBuiltinESMExports()

    return {
      end,
      order,
      spawn,
      unref,
      write,
    }
  }

  it('snapshots SIGINT error context before waiting for registered shutdown participants', async function () {
    const worker = stubWorkerSpawn()
    const {order} = worker
    const exited = deferred<void>()
    const exit = sandbox.stub(process, 'exit').callsFake((() => {
      order.push('exit')
      exited.resolve()
      return undefined as never
    }) as typeof process.exit)
    let duration = 37
    Object.defineProperty(process.stdin, 'isTTY', {configurable: true, value: true})
    const participant = registerDeferredParticipant('SIGINT')

    setupTelemetryHandlers({
      cliStartTime: 100,
      computeDuration: () => duration,
      enableTelemetry: true,
    })

    process.emit('SIGINT')
    await participant.started.promise

    duration = 999
    Object.defineProperty(process.stdin, 'isTTY', {configurable: true, value: false})
    expect(worker.spawn.notCalled, 'worker must wait for participant cleanup').to.be.true
    expect(exit.notCalled, 'process must wait for participant cleanup').to.be.true

    participant.completion.resolve()
    await exited.promise

    expect(worker.spawn.calledOnce).to.be.true
    expect(worker.write.calledOnce).to.be.true
    const envelope = JSON.parse(worker.write.firstCall.args[0] as string)
    expect(envelope.payload).to.include({
      _type: 'error',
      cliRunDuration: 37,
      message: 'Received SIGINT',
      name: 'Error',
    })
    expect(envelope.payload.context).to.deep.equal({isTTY: true})
    expect(order).to.deep.equal(['spawn', 'exit'])
    expect(exit.calledOnceWith(1)).to.be.true
  })

  it('coalesces repeated and different signals into one worker spawn and exit', async function () {
    const order: string[] = []
    const worker = stubWorkerSpawn(order)
    const exited = deferred<void>()
    const exit = sandbox.stub(process, 'exit').callsFake((() => {
      order.push('exit')
      exited.resolve()
      return undefined as never
    }) as typeof process.exit)
    const participant = registerDeferredParticipant('SIGINT')

    setupTelemetryHandlers({
      cliStartTime: 0,
      computeDuration: () => 12,
      enableTelemetry: true,
    })

    process.emit('SIGINT')
    await participant.started.promise
    process.emit('SIGINT')
    process.emit('SIGTERM')
    expect(worker.spawn.notCalled).to.be.true
    expect(exit.notCalled).to.be.true

    participant.completion.resolve()
    await exited.promise
    await waitForImmediate()

    expect(worker.spawn.calledOnce).to.be.true
    expect(worker.write.calledOnce).to.be.true
    expect(exit.calledOnceWith(1)).to.be.true
    expect(order).to.deep.equal(['spawn', 'exit'])
    const envelope = JSON.parse(worker.write.firstCall.args[0] as string)
    expect(envelope.payload.message).to.equal('Received SIGINT')
  })

  it('starts telemetry before replaying a distinct unowned signal and exits afterward', async function () {
    const order: string[] = []
    const worker = stubWorkerSpawn(order)
    const exited = deferred<void>()
    sandbox.stub(process, 'kill').callsFake((_pid, signal) => {
      order.push(`replay:${signal}`)
      return true
    })
    sandbox.stub(process, 'exit').callsFake((() => {
      order.push('exit')
      exited.resolve()
      return undefined as never
    }) as typeof process.exit)
    const participant = registerDeferredParticipant('SIGTERM')

    setupTelemetryHandlers({
      cliStartTime: 0,
      computeDuration: () => 12,
      enableTelemetry: true,
    })

    process.emit('SIGTERM')
    await participant.started.promise
    process.emit('SIGHUP')
    participant.completion.resolve()
    await exited.promise

    expect(worker.spawn.calledOnce).to.be.true
    expect(order).to.deep.equal(['spawn', 'replay:SIGHUP', 'exit'])
  })

  it('sends signal telemetry when no shutdown participant is registered', async function () {
    const worker = stubWorkerSpawn()
    const exited = deferred<void>()
    const exit = sandbox.stub(process, 'exit').callsFake((() => {
      exited.resolve()
      return undefined as never
    }) as typeof process.exit)

    setupTelemetryHandlers({
      cliStartTime: 0,
      computeDuration: () => 24,
      enableTelemetry: true,
    })

    process.emit('SIGTERM')
    await exited.promise

    expect(worker.spawn.calledOnce).to.be.true
    expect(worker.write.calledOnce).to.be.true
    expect(exit.calledOnceWith(1)).to.be.true
    const envelope = JSON.parse(worker.write.firstCall.args[0] as string)
    expect(envelope.payload).to.include({
      _type: 'error',
      cliRunDuration: 24,
      message: 'Received SIGTERM',
      name: 'Error',
    })
    expect(envelope.payload).not.to.have.property('context')
  })
})
