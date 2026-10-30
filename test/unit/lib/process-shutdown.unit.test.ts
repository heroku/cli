import {expect} from 'chai'
import {EventEmitter} from 'node:events'
import * as sinon from 'sinon'

import {awaitProcessShutdown, registerShutdownParticipant} from '../../../src/lib/process-shutdown.js'

const shutdownSignals = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const
type ShutdownSignal = typeof shutdownSignals[number]

function listenersFor(signal: ShutdownSignal): unknown[] {
  return EventEmitter.prototype.listeners.call(process, signal) as unknown[]
}

function emitSignal(signal: ShutdownSignal) {
  EventEmitter.prototype.emit.call(process, signal, signal)
}

function stubSignalListeners(
  originalListeners: Record<ShutdownSignal, unknown[]>,
  owners: Partial<Record<ShutdownSignal, unknown>> = {},
) {
  const realListeners = process.listeners.bind(process)
  sinon.stub(process, 'listeners').callsFake(event => {
    const signal = String(event) as ShutdownSignal
    if (!shutdownSignals.includes(signal)) return realListeners(event)

    const coordinator = listenersFor(signal).find(listener => !originalListeners[signal].includes(listener))
    const listeners = [...(coordinator ? [coordinator] : []), ...(owners[signal] ? [owners[signal]] : [])]
    return listeners as unknown as ReturnType<typeof process.listeners>
  })
}

const waitForImmediate = () => new Promise<void>(resolve => {
  setImmediate(resolve)
})

describe('process shutdown coordinator', function () {
  let originalListeners: Record<ShutdownSignal, unknown[]>

  beforeEach(function () {
    originalListeners = Object.fromEntries(shutdownSignals.map(signal => [signal, listenersFor(signal)])) as Record<ShutdownSignal, unknown[]>
  })

  afterEach(function () {
    for (const signal of shutdownSignals) {
      for (const listener of listenersFor(signal)) {
        if (!originalListeners[signal].includes(listener)) Reflect.apply(EventEmitter.prototype.removeListener, process, [signal, listener])
      }
    }

    sinon.restore()
  })

  it('replays distinct unowned signals after shutdown waiters finish', async function () {
    const order: string[] = []
    let finishCleanup!: () => void
    const cleanupWait = new Promise<void>(resolve => {
      finishCleanup = resolve
    })
    const participant = sinon.stub().callsFake(async (signal: ShutdownSignal) => {
      order.push(`cleanup started:${signal}`)
      await cleanupWait
      order.push(`cleanup finished:${signal}`)
    })
    const unregister = registerShutdownParticipant(participant)
    let ownerShutdown: Promise<void> | undefined
    const owner = sinon.stub().callsFake((signal: ShutdownSignal) => {
      order.push('owner started')
      ownerShutdown = awaitProcessShutdown(signal)
      ownerShutdown.then(() => order.push('owner finished'))
    })
    process.on('SIGTERM', owner)
    stubSignalListeners(originalListeners, {SIGTERM: owner})
    const coordinators = new Map<ShutdownSignal, unknown>(shutdownSignals.map(signal => [
      signal,
      listenersFor(signal).find(listener => !originalListeners[signal].includes(listener)),
    ] as const))
    const kill = sinon.stub(process, 'kill').returns(true)

    try {
      for (const signal of shutdownSignals) {
        expect(coordinators.get(signal)).to.be.a('function')
        expect(listenersFor(signal)[0]).to.equal(coordinators.get(signal))
      }

      emitSignal('SIGTERM')
      emitSignal('SIGHUP')
      expect(ownerShutdown).to.be.a('promise')
      expect(participant.calledOnceWith('SIGTERM'), 'callbacks receive first signal only').to.be.true
      expect(owner.calledOnceWith('SIGTERM')).to.be.true
      expect(kill.notCalled).to.be.true

      finishCleanup()
      await ownerShutdown

      expect(participant.calledOnceWith('SIGTERM'), 'callbacks receive first signal only').to.be.true
      expect(owner.calledOnceWith('SIGTERM')).to.be.true
      expect(kill.notCalled, 'signal replay waits until shutdown waiters resume').to.be.true
      expect(order).to.deep.equal([
        'cleanup started:SIGTERM', 'owner started', 'cleanup finished:SIGTERM', 'owner finished',
      ])
      await waitForImmediate()
      expect(kill.calledOnceWith(process.pid, 'SIGHUP'), 'only the unowned signal is replayed').to.be.true
      for (const signal of shutdownSignals) expect(listenersFor(signal)).not.to.include(coordinators.get(signal))
    } finally {
      finishCleanup()
      unregister()
      process.removeListener('SIGTERM', owner)
    }
  })

  it('redelivers each distinct unowned signal only after cleanup and coordinator removal', async function () {
    const order: string[] = []
    let finish!: () => void
    const wait = new Promise<void>(resolve => {
      finish = resolve
    })
    const participant = sinon.stub().callsFake(async (signal: ShutdownSignal) => {
      order.push(`start:${signal}`)
      await wait
      order.push(`end:${signal}`)
    })
    const unregister = registerShutdownParticipant(participant)
    const coordinators = new Map<ShutdownSignal, unknown>(shutdownSignals.map(signal => [
      signal,
      listenersFor(signal).find(listener => !originalListeners[signal].includes(listener)),
    ] as const))
    const kill = sinon.stub(process, 'kill').callsFake((_pid, signal) => {
      expect(listenersFor(signal as ShutdownSignal)).not.to.include(coordinators.get(signal as ShutdownSignal))
      order.push(`kill:${signal}`)
      return true
    })
    stubSignalListeners(originalListeners)

    try {
      emitSignal('SIGTERM')
      const first = awaitProcessShutdown('SIGTERM')
      emitSignal('SIGINT')
      const joined = awaitProcessShutdown('SIGINT')
      await Promise.resolve()
      expect(participant.calledOnceWith('SIGTERM')).to.be.true
      expect(kill.notCalled).to.be.true

      finish()
      await Promise.all([first, joined])
      await waitForImmediate()

      expect(order).to.deep.equal(['start:SIGTERM', 'end:SIGTERM', 'kill:SIGTERM', 'kill:SIGINT'])
      expect(kill.calledTwice).to.be.true
    } finally {
      finish()
      unregister()
      kill.restore()
    }
  })

  it('drains participants registered during dispatch in a later batch', async function () {
    const secondParticipant = sinon.stub()
    let unregisterSecond: (() => void) | undefined
    const firstParticipant = sinon.stub().callsFake(() => {
      unregisterSecond = registerShutdownParticipant(secondParticipant)
    })
    const unregisterFirst = registerShutdownParticipant(firstParticipant)
    const kill = sinon.stub(process, 'kill').returns(true)
    stubSignalListeners(originalListeners)

    try {
      const shutdown = awaitProcessShutdown('SIGHUP')
      await shutdown
      await waitForImmediate()
      expect(firstParticipant.calledOnceWith('SIGHUP')).to.be.true
      expect(secondParticipant.calledOnceWith('SIGHUP')).to.be.true
      expect(kill.calledOnceWith(process.pid, 'SIGHUP')).to.be.true
    } finally {
      unregisterFirst()
      unregisterSecond?.()
    }
  })

  it('starts a fresh barrier for participants registered after the previous barrier settles', async function () {
    const firstParticipant = sinon.stub()
    const unregisterFirst = registerShutdownParticipant(firstParticipant)
    const kill = sinon.stub(process, 'kill').returns(true)

    try {
      const firstShutdown = awaitProcessShutdown('SIGINT')
      expect(firstParticipant.calledOnceWith('SIGINT'), 'callbacks start synchronously').to.be.true
      await firstShutdown
      expect(firstParticipant.calledOnceWith('SIGINT')).to.be.true

      const nextParticipant = sinon.stub()
      const unregisterNext = registerShutdownParticipant(nextParticipant)
      try {
        emitSignal('SIGTERM')
        await awaitProcessShutdown('SIGTERM')
        await waitForImmediate()
        expect(nextParticipant.calledOnceWith('SIGTERM')).to.be.true
        expect(kill.calledTwice).to.be.true
        expect(kill.secondCall.calledWith(process.pid, 'SIGTERM')).to.be.true
      } finally {
        unregisterNext()
      }
    } finally {
      unregisterFirst()
    }
  })

  it('continues all callbacks then rejects when a participant fails', async function () {
    const failure = new Error('participant failed')
    const rejectingParticipant = sinon.stub().rejects(failure)
    const succeedingParticipant = sinon.stub()
    const unregisterRejecting = registerShutdownParticipant(rejectingParticipant)
    const unregisterSucceeding = registerShutdownParticipant(succeedingParticipant)
    const coordinator = listenersFor('SIGTERM').find(listener => !originalListeners.SIGTERM.includes(listener))
    const externalListener = sinon.stub()
    process.on('SIGTERM', externalListener)
    const realListeners = process.listeners.bind(process)
    sinon.stub(process, 'listeners').callsFake(event => String(event) === 'SIGTERM'
      ? [coordinator] as unknown as ReturnType<typeof process.listeners>
      : realListeners(event))
    const kill = sinon.stub(process, 'kill').callsFake((_pid, signal) => {
      expect(listenersFor(signal as ShutdownSignal)).not.to.include(coordinator)
      return true
    })

    try {
      let shutdownError: unknown
      try {
        await awaitProcessShutdown('SIGTERM')
      } catch (error) {
        shutdownError = error
      }

      await waitForImmediate()

      expect(shutdownError).to.be.instanceOf(AggregateError)
      expect((shutdownError as AggregateError).errors).to.deep.equal([failure])
      expect(rejectingParticipant.calledOnce).to.be.true
      expect(succeedingParticipant.calledOnce).to.be.true
      expect(kill.calledOnceWith(process.pid, 'SIGTERM')).to.be.true
      expect(externalListener.called).to.be.false
    } finally {
      unregisterRejecting()
      unregisterSucceeding()
      process.removeListener('SIGTERM', externalListener)
    }
  })
})
