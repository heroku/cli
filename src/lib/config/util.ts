import fs from 'fs-extra'
import childProcess from 'node:child_process'
import {
  lstatSync, unlinkSync, writeFileSync, writeSync,
} from 'node:fs'
import tmp from 'tmp'

const editSignalHandlers = new WeakSet<NodeJS.SignalsListener>()
type EditSignalHandler = {
  interrupt: (hasOtherOwner: boolean) => void
  reportCleanupFailure: () => void
}

const editSignalHandlerCallbacks = new Map<NodeJS.Signals, Map<NodeJS.SignalsListener, EditSignalHandler>>()
const handlingEditSignals = new Set<NodeJS.Signals>()

export class Editor {
  async edit(input: string, options = {}) {
    const tmpFile = tmp.fileSync(options)
    let removeCallbackAttempted = false
    let cleanupFailed = false
    let cleanupFailureReported = false
    let result: string | undefined
    let primaryError: unknown
    let hasPrimaryError = false
    let interruptedSignal: NodeJS.Signals | undefined
    let rejectInterruption: (error: Error) => void = () => {}
    let removeOwnedListeners = () => {}
    let removeOwnedSignalListeners = () => {}
    let removeChildListeners = () => {}

    const cleanup = () => {
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

    try {
      let interruptionRejected = false
      let interruptedBySignalOwner = false
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
        cleanup()
        reportCleanupFailure()
      }

      const onEditSignal = (signal: NodeJS.Signals) => {
        if (interruptedSignal || handlingEditSignals.has(signal)) return

        const hasOtherOwner = process.listeners(signal).some(listener => !editSignalHandlers.has(listener))
        const activeEdits = Array.from(editSignalHandlerCallbacks.get(signal)?.values() ?? [])
        handlingEditSignals.add(signal)
        try {
          // All edits must clean up before restoring native signal termination.
          for (const edit of activeEdits) edit.interrupt(hasOtherOwner)

          if (!hasOtherOwner) {
            for (const edit of activeEdits) edit.reportCleanupFailure()

            try {
              // Restore Node's default signal termination once, after every edit is cleaned up.
              process.kill(process.pid, signal)
            } catch {
              // The interruption promise still prevents config processing.
            }
          }
        } finally {
          handlingEditSignals.delete(signal)
        }
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
        if (interruptedSignal) return

        interruptedSignal = signal
        interruptedBySignalOwner = hasOtherOwner
        if (!interruptionRejected) {
          interruptionRejected = true
          rejectInterruption(new Error(`Editor interrupted by ${signal}`))
        }

        cleanup()
        removeOwnedSignalListeners()
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

      if (tmpFile.fd === undefined) writeFileSync(tmpFile.name, input, 'utf8')
      else writeFileSync(tmpFile.fd, input, 'utf8')

      if (interruptedSignal) throw new Error(`Editor interrupted by ${interruptedSignal}`)

      // Let a signal delivered during synchronous setup interrupt before spawn.
      await Promise.race([new Promise<void>(resolve => setImmediate(resolve)), interruptionPromise])
      if (interruptedSignal) throw new Error(`Editor interrupted by ${interruptedSignal}`)

      const editor = process.env.VISUAL || process.env.EDITOR || 'vim'
      const child = childProcess.spawn(editor, [tmpFile.name], {stdio: 'inherit'})

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
              child.removeListener(event, listener)
            } catch {
              // Attempt to remove every listener owned by this edit.
            }
          }
        }

        child.on('error', onError)
        child.on('exit', onExit)
        child.on('close', onClose)
      })

      await Promise.race([editorPromise, interruptionPromise])
      if (interruptedBySignalOwner) throw new Error(`Editor interrupted by ${interruptedSignal}`)

      result = await Promise.race([fs.readFile(tmpFile.name, 'utf8'), interruptionPromise])
      if (interruptedBySignalOwner) throw new Error(`Editor interrupted by ${interruptedSignal}`)
    } catch (error) {
      primaryError = error
      hasPrimaryError = true
    } finally {
      if (interruptedSignal && !hasPrimaryError) {
        primaryError = new Error(`Editor interrupted by ${interruptedSignal}`)
        hasPrimaryError = true
      }

      removeChildListeners()
      removeOwnedListeners()
      cleanup()
      if (cleanupFailed) {
        if (hasPrimaryError) reportCleanupFailure()
        else {
          primaryError = new Error('Failed to remove temporary config file')
          hasPrimaryError = true
        }
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
