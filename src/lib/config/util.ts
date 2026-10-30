import fs from 'fs-extra'
import childProcess from 'node:child_process'
import {
  lstatSync, unlinkSync, writeFileSync, writeSync,
} from 'node:fs'
import tmp from 'tmp'

import {registerShutdownParticipant, type ShutdownSignal} from '../process-shutdown.js'

const noop = () => {}
const waitForNextTurn = () => new Promise<void>(resolve => {
  setImmediate(resolve)
})

export class Editor {
  async edit(input: string, options = {}) {
    let tmpFile: ReturnType<typeof tmp.fileSync> | undefined
    let removeCallbackAttempted = false
    let cleanupFailed = false
    let cleanupCompleted = false
    let cleanupFailureReported = false
    let result: string | undefined
    let editError: unknown
    let hasEditError = false
    let interruptionError: Error | undefined
    let rejectInterruption!: (error: Error) => void
    let unregisterShutdownParticipant = noop
    let removeChildListeners = noop
    let removeChildExitListeners = noop
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
          child.kill('SIGTERM')
        } catch {
          // The child may already have exited; wait for its exit event below.
        }

        if (await waitForChildExit(1000)) return true

        if (childIsRunning()) {
          try {
            child.kill('SIGKILL')
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
        // A successful kill() only confirms that the signal was sent, not that
        // the child exited. Exit hooks cannot wait for that confirmation.
        child.kill('SIGKILL')
      } catch {
        // The child may have exited while the signal was being sent.
      }

      return false
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
        // Write synchronously so cleanup diagnostics are not lost during process termination.
        writeSync(2, 'Failed to clean up temporary config file\n')
      } catch {
        // Cleanup diagnostics must not change termination behavior.
      }
    }

    const reportUnconfirmedExitCleanup = () => {
      cleanupFailureReported = true
      try {
        writeSync(2, 'Could not confirm editor termination; temporary config file may remain\n')
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

    let interruptionCleanupPromise: Promise<void> | undefined
    const interrupt = (signal: ShutdownSignal) => {
      if (interruptionCleanupPromise) return interruptionCleanupPromise

      interruptionError = new Error(`Editor interrupted by ${signal}`)
      rejectInterruption(interruptionError)
      interruptionCleanupPromise = (async () => {
        const childTerminated = await terminateChild()
        if (childTerminated) cleanup()
        else if (childExitObserved) cleanupAfterLateChildExit()
        else lateChildCleanupPending = true
      })()

      return interruptionCleanupPromise
    }

    const interruptionPromise = new Promise<never>((_resolve, reject) => {
      rejectInterruption = reject
    })
    // Keep setup-time interruption from becoming an unhandled rejection.
    interruptionPromise.catch(() => {})

    const awaitWhileActive = async <T>(operation: Promise<T>): Promise<T> => {
      const value = await Promise.race([operation, interruptionPromise])
      if (interruptionError) throw interruptionError
      return value
    }

    let exitListenerInstalled = false
    let lifecycleListenersRemoved = false
    const onExit = () => {
      unregisterShutdownParticipant()
      if (terminateChildBeforeExit()) cleanup()
      else reportUnconfirmedExitCleanup()
      if (cleanupFailed) reportCleanupFailure()
    }

    const removeLifecycleListeners = () => {
      if (lifecycleListenersRemoved) return
      lifecycleListenersRemoved = true
      unregisterShutdownParticipant()

      if (exitListenerInstalled) {
        try {
          process.removeListener('exit', onExit)
        } catch {
          // Attempt to remove every listener owned by this edit.
        }

        exitListenerInstalled = false
      }
    }

    try {
      unregisterShutdownParticipant = registerShutdownParticipant(interrupt)
      process.once('exit', onExit)
      exitListenerInstalled = true

      await awaitWhileActive(waitForNextTurn())

      const acquiredTmpFile = tmp.fileSync(options)
      tmpFile = acquiredTmpFile

      // Catch a shutdown signal delivered synchronously during temporary-file acquisition.
      await awaitWhileActive(waitForNextTurn())

      writeFileSync(acquiredTmpFile.fd === undefined ? acquiredTmpFile.name : acquiredTmpFile.fd, input, 'utf8')

      // Let a shutdown signal during synchronous setup interrupt before spawn.
      await awaitWhileActive(waitForNextTurn())

      const editor = process.env.VISUAL || process.env.EDITOR || 'vim'
      const spawnedChild = childProcess.spawn(editor, [acquiredTmpFile.name], {stdio: 'inherit'})
      child = spawnedChild

      childExitPromise = new Promise<void>(resolve => {
        const onChildExit = () => {
          childExitObserved = true
          resolve()
          if (lateChildCleanupPending) cleanupAfterLateChildExit()
        }

        const onChildError = () => {
          if (spawnedChild.pid === undefined) {
            childExitObserved = true
            resolve()
            if (lateChildCleanupPending) cleanupAfterLateChildExit()
          }
        }

        removeChildExitListeners = () => {
          for (const [event, listener] of [['exit', onChildExit], ['error', onChildError]] as const) {
            try {
              spawnedChild.removeListener(event, listener)
            } catch {
              // Attempt to remove every listener owned by this edit.
            }
          }
        }

        spawnedChild.once('exit', onChildExit)
        spawnedChild.once('error', onChildError)
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

        const onChildExit = (code: null | number, signal: NodeJS.Signals | null) => onStatus(code, signal)
        const onClose = (code: null | number, signal: NodeJS.Signals | null) => onStatus(code, signal)

        removeChildListeners = () => {
          for (const [event, listener] of [
            ['error', onError],
            ['exit', onChildExit],
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
        spawnedChild.on('exit', onChildExit)
        spawnedChild.on('close', onClose)
      })

      await awaitWhileActive(editorPromise)

      result = await awaitWhileActive(fs.readFile(acquiredTmpFile.name, 'utf8'))
    } catch (error) {
      editError = error
      hasEditError = true
    } finally {
      const childTerminated = !child || childExitObserved || await terminateChild()
      if (!childTerminated) {
        if (childExitObserved) cleanupAfterLateChildExit()
        else lateChildCleanupPending = true
      }

      removeChildListeners()
      removeLifecycleListeners()

      if (childTerminated) {
        if (!lateChildCleanupCompleted) cleanup()
        if (cleanupFailed) reportCleanupFailure()
        removeChildExitListeners()
      }

      if (interruptionError && !hasEditError) {
        editError = interruptionError
        hasEditError = true
      }
    }

    if (hasEditError) throw editError

    return result as string
  }
}

export class EditorFactory {
  public static createEditor(): Editor {
    return new Editor()
  }
}
