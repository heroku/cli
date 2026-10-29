import fs from 'fs-extra'
import childProcess from 'node:child_process'
import {
  lstatSync, unlinkSync, writeFileSync, writeSync,
} from 'node:fs'
import tmp from 'tmp'

const editSignalHandlers = new WeakSet<NodeJS.SignalsListener>()
type EditSignalHandler = {
  interrupt: (hasOtherOwner: boolean) => Promise<void>
  reportCleanupFailure: () => void
}

type PendingEditSignal = {
  hasOtherOwner: boolean
}

const editSignalHandlerCallbacks = new Map<NodeJS.Signals, Map<NodeJS.SignalsListener, EditSignalHandler>>()
const handlingEditSignals = new Set<NodeJS.Signals>()
const pendingEditSignals = new Map<NodeJS.Signals, PendingEditSignal>()
const pendingEditSignalRedeliveries: NodeJS.Signals[] = []

const handleEditSignal = (signal: NodeJS.Signals, pending: PendingEditSignal) => {
  const activeEdits = [...(editSignalHandlerCallbacks.get(signal)?.values() ?? [])]
  handlingEditSignals.add(signal)
  Promise.all(activeEdits.map(edit => edit.interrupt(pending.hasOtherOwner)))
    .catch(() => {})
    .finally(() => {
      if (!pending.hasOtherOwner) {
        for (const edit of activeEdits) edit.reportCleanupFailure()
        pendingEditSignalRedeliveries.push(signal)
      }

      handlingEditSignals.delete(signal)

      const nextSignal = pendingEditSignals.keys().next().value as NodeJS.Signals | undefined
      if (nextSignal) {
        const nextPending = pendingEditSignals.get(nextSignal)!
        pendingEditSignals.delete(nextSignal)
        handleEditSignal(nextSignal, nextPending)
      } else {
        for (const pendingSignal of pendingEditSignalRedeliveries.splice(0)) {
          try {
            // Restore Node's default signal termination once, after every edit is cleaned up.
            process.kill(process.pid, pendingSignal)
          } catch {
            // The interruption promise still prevents config processing.
          }
        }
      }
    })
}

export class Editor {
  async edit(input: string, options = {}) {
    let tmpFile: ReturnType<typeof tmp.fileSync> | undefined
    let removeCallbackAttempted = false
    let cleanupFailed = false
    let cleanupCompleted = false
    let cleanupFailureReported = false
    let result: string | undefined
    let primaryError: unknown
    let hasPrimaryError = false
    let interruptedSignal: NodeJS.Signals | undefined
    let rejectInterruption: (error: Error) => void = () => {}
    let removeOwnedListeners = () => {}
    let removeOwnedSignalListeners = () => {}
    let removeChildListeners = () => {}
    let removeChildExitListeners = () => {}
    let child: ReturnType<typeof childProcess.spawn> | undefined
    let childExitObserved = false
    let lateChildCleanupPending = false
    let lateChildCleanupCompleted = false
    let childExitPromise: Promise<void> | undefined
    let childTerminationPromise: Promise<boolean> | undefined

    const childIsRunning = () => Boolean(child && !childExitObserved
      && (child.exitCode === null || child.exitCode === undefined)
      && (child.signalCode === null || child.signalCode === undefined))

    const waitForChildExit = async (timeoutMs: number) => {
      if (!childExitPromise) return true

      let timeout: NodeJS.Timeout | undefined
      const exited = await Promise.race([
        childExitPromise.then(() => true),
        new Promise<boolean>(resolve => {
          timeout = setTimeout(() => resolve(false), timeoutMs)
          timeout.unref?.()
        }),
      ])
      if (timeout) clearTimeout(timeout)

      return exited
    }

    const terminateChild = (): Promise<boolean> => {
      if (!child || !childExitPromise) return Promise.resolve(true)
      if (childTerminationPromise) return childTerminationPromise

      childTerminationPromise = (async () => {
        if (!childIsRunning()) return true

        try {
          child!.kill('SIGTERM')
        } catch {
          // The child may already have exited; wait for its exit event below.
        }

        if (await waitForChildExit(1000)) return true

        if (childIsRunning()) {
          try {
            child!.kill('SIGKILL')
          } catch {
            // The child may have exited while escalating termination.
          }
        }

        return waitForChildExit(1000)
      })()

      return childTerminationPromise
    }

    const terminateChildBeforeExit = () => {
      if (!child || !childIsRunning()) return true

      try {
        return child.kill('SIGKILL') || !childIsRunning()
      } catch (error) {
        const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined
        // ESRCH means the owned child already exited; all other failures are inconclusive.
        return code === 'ESRCH'
      }
    }

    const cleanup = () => {
      if (!tmpFile || cleanupCompleted) return

      if (!removeCallbackAttempted) {
        removeCallbackAttempted = true
        try {
          tmpFile.removeCallback()
        } catch {
          // Verify the path below; the callback may fail after successfully removing it.
        }
      }

      try {
        unlinkSync(tmpFile.name)
      } catch {
        // Verify the path below rather than relying on the removal mechanism's result.
      }

      try {
        lstatSync(tmpFile.name)
        cleanupFailed = true
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          cleanupFailed = false
          cleanupCompleted = true
          return
        }

        cleanupFailed = true
      }
    }

    const reportCleanupFailure = () => {
      if (!cleanupFailed || cleanupFailureReported) return

      cleanupFailureReported = true
      try {
        writeSync(2, 'Failed to clean up temporary config file\n')
      } catch {
        // Cleanup diagnostics must not change termination behavior.
      }
    }

    const cleanupAfterLateChildExit = () => {
      if (lateChildCleanupCompleted) return

      lateChildCleanupPending = false
      lateChildCleanupCompleted = true
      cleanup()
      reportCleanupFailure()
      removeChildListeners()
      removeChildExitListeners()
    }

    try {
      let interruptionRejected = false
      let interruptedBySignalOwner = false
      let interruptionCleanupPromise: Promise<void> | undefined
      let exitListenerInstalled = false
      let listenersRemoved = false
      const signalHandlers: Array<{handler: NodeJS.SignalsListener; signal: NodeJS.Signals;}> = []
      const interruptionPromise = new Promise<never>((_resolve, reject) => {
        rejectInterruption = reject
      })

      // Keep a rejection from becoming unhandled if interruption happens during setup.
      interruptionPromise.catch(() => undefined)

      const onExit = () => {
        removeOwnedListeners()
        if (terminateChildBeforeExit()) cleanup()
        else cleanupFailed = true
        reportCleanupFailure()
      }

      const onEditSignal = (signal: NodeJS.Signals) => {
        if (handlingEditSignals.has(signal)) return

        const hasOtherOwner = process.listeners(signal).some(listener => !editSignalHandlers.has(listener))
        const pending = {hasOtherOwner}
        if (handlingEditSignals.size > 0) {
          if (!pendingEditSignals.has(signal)) pendingEditSignals.set(signal, pending)
          return
        }

        handleEditSignal(signal, pending)
      }

      removeOwnedSignalListeners = () => {
        for (const {handler, signal} of signalHandlers) {
          try {
            process.removeListener(signal, handler)
          } catch {
            // Attempt to remove every listener owned by this edit.
          } finally {
            editSignalHandlers.delete(handler)
            editSignalHandlerCallbacks.get(signal)?.delete(handler)
            if (editSignalHandlerCallbacks.get(signal)?.size === 0) editSignalHandlerCallbacks.delete(signal)
          }
        }
      }

      const interruptThisEdit = (signal: NodeJS.Signals, hasOtherOwner: boolean) => {
        if (interruptionCleanupPromise) return interruptionCleanupPromise
        if (interruptedSignal) return Promise.resolve()

        interruptedSignal = signal
        interruptedBySignalOwner = hasOtherOwner
        if (!interruptionRejected) {
          interruptionRejected = true
          rejectInterruption(new Error(`Editor interrupted by ${signal}`))
        }

        interruptionCleanupPromise = (async () => {
          if (await terminateChild()) {
            if (!lateChildCleanupCompleted) cleanup()
          } else if (childExitObserved) cleanupAfterLateChildExit()
          else lateChildCleanupPending = true

          removeOwnedSignalListeners()
        })()

        return interruptionCleanupPromise
      }

      removeOwnedListeners = () => {
        if (listenersRemoved) return
        listenersRemoved = true

        removeOwnedSignalListeners()

        if (exitListenerInstalled) {
          try {
            process.removeListener('exit', onExit)
          } catch {
            // Attempt to remove every listener owned by this edit.
          }

          exitListenerInstalled = false
        }
      }

      const installLifecycleListeners = () => {
        process.on('exit', onExit)
        exitListenerInstalled = true

        const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGHUP']
        for (const signal of signals) {
          const handler: NodeJS.SignalsListener = () => onEditSignal(signal)

          signalHandlers.push({handler, signal})
          editSignalHandlers.add(handler)
          const signalCallbacks = editSignalHandlerCallbacks.get(signal) ?? new Map<NodeJS.SignalsListener, EditSignalHandler>()
          signalCallbacks.set(handler, {
            interrupt: hasOtherOwner => interruptThisEdit(signal, hasOtherOwner),
            reportCleanupFailure,
          })
          editSignalHandlerCallbacks.set(signal, signalCallbacks)
          try {
            process.prependListener(signal, handler)
          } catch (error) {
            signalHandlers.pop()
            editSignalHandlers.delete(handler)
            signalCallbacks.delete(handler)
            if (signalCallbacks.size === 0) editSignalHandlerCallbacks.delete(signal)
            throw error
          }

          if (interruptedSignal) throw new Error(`Editor interrupted by ${interruptedSignal}`)
        }
      }

      installLifecycleListeners()

      if (interruptedSignal) throw new Error(`Editor interrupted by ${interruptedSignal}`)

      const acquiredTmpFile = tmp.fileSync(options)
      tmpFile = acquiredTmpFile

      await Promise.race([new Promise<void>(resolve => setImmediate(resolve)), interruptionPromise])

      if (interruptedSignal) {
        cleanup()
        throw new Error(`Editor interrupted by ${interruptedSignal}`)
      }

      if (acquiredTmpFile.fd === undefined) writeFileSync(acquiredTmpFile.name, input, 'utf8')
      else writeFileSync(acquiredTmpFile.fd, input, 'utf8')

      if (interruptedSignal) throw new Error(`Editor interrupted by ${interruptedSignal}`)

      // Let a signal delivered during synchronous setup interrupt before spawn.
      await Promise.race([new Promise<void>(resolve => setImmediate(resolve)), interruptionPromise])
      if (interruptedSignal) throw new Error(`Editor interrupted by ${interruptedSignal}`)

      const editor = process.env.VISUAL || process.env.EDITOR || 'vim'
      const spawnedChild = childProcess.spawn(editor, [acquiredTmpFile.name], {stdio: 'inherit'})
      child = spawnedChild
      childExitPromise = new Promise<void>(resolve => {
        const onExit = () => {
          childExitObserved = true
          resolve()
          if (lateChildCleanupPending) cleanupAfterLateChildExit()
        }

        const onError = () => {
          if (spawnedChild.pid === undefined) {
            childExitObserved = true
            resolve()
            if (lateChildCleanupPending) cleanupAfterLateChildExit()
          }
        }

        removeChildExitListeners = () => {
          for (const [event, listener] of [['exit', onExit], ['error', onError]] as const) {
            try {
              spawnedChild.removeListener(event, listener)
            } catch {
              // Attempt to remove every listener owned by this edit.
            }
          }
        }

        spawnedChild.once('exit', onExit)
        spawnedChild.once('error', onError)
      })

      const editorPromise = new Promise<void>((resolve, reject) => {
        let settled = false

        const settle = (error?: Error) => {
          if (settled) return
          settled = true
          removeChildListeners()
          if (error) reject(error)
          else resolve()
        }

        const onError = (error: Error) => settle(error)
        const onStatus = (code: null | number, signal: NodeJS.Signals | null) => {
          if (signal) return settle(new Error(`Editor terminated by signal ${signal}`))
          if (code === 0) return settle()
          if (code === null) return settle(new Error('Editor exited without a status'))
          settle(new Error(`Editor exited with code ${code}`))
        }

        const onExit = (code: null | number, signal: NodeJS.Signals | null) => onStatus(code, signal)
        const onClose = (code: null | number, signal: NodeJS.Signals | null) => onStatus(code, signal)

        removeChildListeners = () => {
          for (const [event, listener] of [
            ['error', onError],
            ['exit', onExit],
            ['close', onClose],
          ] as const) {
            try {
              spawnedChild.removeListener(event, listener)
            } catch {
              // Attempt to remove every listener owned by this edit.
            }
          }
        }

        spawnedChild.on('error', onError)
        spawnedChild.on('exit', onExit)
        spawnedChild.on('close', onClose)
      })

      await Promise.race([editorPromise, interruptionPromise])
      if (interruptedBySignalOwner) throw new Error(`Editor interrupted by ${interruptedSignal}`)

      result = await Promise.race([fs.readFile(acquiredTmpFile.name, 'utf8'), interruptionPromise])
      if (interruptedBySignalOwner) throw new Error(`Editor interrupted by ${interruptedSignal}`)
    } catch (error) {
      primaryError = error
      hasPrimaryError = true
    } finally {
      if (interruptedSignal && !hasPrimaryError) {
        primaryError = new Error(`Editor interrupted by ${interruptedSignal}`)
        hasPrimaryError = true
      }

      const childTerminated = !child || childExitObserved || await terminateChild()
      if (!childTerminated) {
        if (childExitObserved) cleanupAfterLateChildExit()
        else lateChildCleanupPending = true
      }

      removeChildListeners()
      removeOwnedListeners()

      if (childTerminated) {
        if (!lateChildCleanupCompleted) cleanup()
        if (cleanupFailed) reportCleanupFailure()
        removeChildExitListeners()
      }
    }

    if (hasPrimaryError) throw primaryError

    return result as string
  }
}

export class EditorFactory {
  public static createEditor(): Editor {
    return new Editor()
  }
}
