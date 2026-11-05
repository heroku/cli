export type ShutdownSignal = 'SIGHUP' | 'SIGINT' | 'SIGTERM'

type ShutdownParticipant = (signal: ShutdownSignal) => Promise<void> | void
type Registration = {callback: ShutdownParticipant}
type Observation = {hasExternalOwner: boolean; signal: ShutdownSignal}
const signals: ShutdownSignal[] = ['SIGHUP', 'SIGINT', 'SIGTERM']
const participants = new Set<Registration>()
const coordinators = new Map<ShutdownSignal, () => void>()
const observations: Observation[] = []
let shutdown: Promise<void> | undefined

function hasExternalOwner(signal: ShutdownSignal): boolean {
  const coordinator = coordinators.get(signal)
  return process.listeners(signal).some(listener => listener !== coordinator)
}

function removeCoordinatorListeners() {
  for (const [signal, listener] of coordinators) process.removeListener(signal, listener)
  coordinators.clear()
}

function syncCoordinatorListeners() {
  if (shutdown) return
  if (participants.size > 0) {
    for (const signal of signals) {
      if (coordinators.has(signal)) continue
      const listener = () => requestShutdown(signal, hasExternalOwner(signal)).catch(() => {})
      coordinators.set(signal, listener)
      process.prependListener(signal, listener)
    }
  } else {
    removeCoordinatorListeners()
  }
}

async function cleanParticipants(signal: ShutdownSignal): Promise<unknown[]> {
  const processed = new Set<Registration>()
  const failures: unknown[] = []

  while (true) {
    const batch = [...participants].filter(participant => !processed.has(participant))
    if (batch.length === 0) return failures

    // eslint-disable-next-line no-await-in-loop -- drain participants registered during cleanup
    const results = await Promise.allSettled(batch.map(async participant => {
      processed.add(participant)
      try {
        await participant.callback(signal)
      } finally {
        participants.delete(participant)
      }
    }))
    for (const result of results) if (result.status === 'rejected') failures.push(result.reason)
  }
}

function requestShutdown(signal: ShutdownSignal, hasOwner = hasExternalOwner(signal)): Promise<void> {
  if (!shutdown && participants.size === 0) return Promise.resolve()

  observations.push({hasExternalOwner: hasOwner, signal})
  if (shutdown) return shutdown

  let resolve!: () => void
  let reject!: (error: unknown) => void
  shutdown = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  const barrier = shutdown

  const finish = () => {
    removeCoordinatorListeners()
    observations.length = 0
    shutdown = undefined
    syncCoordinatorListeners()
  }

  const run = async () => {
    try {
      const failures = await cleanParticipants(signal)
      removeCoordinatorListeners()

      // Replay independently by signal. Defer it so shutdown waiters (notably telemetry) can
      // finish post-cleanup work before an unowned signal applies its default action.
      const signalsToReplay = [...new Set(observations
        .filter(observation => !observation.hasExternalOwner)
        .map(observation => observation.signal))]

      finish()
      if (failures.length > 0) reject(new AggregateError(failures, `Shutdown participants failed for ${signal}`))
      else resolve()

      if (signalsToReplay.length > 0) {
        queueMicrotask(() => {
          for (const observedSignal of signalsToReplay) {
            try {
              process.kill(process.pid, observedSignal)
            } catch {
              // Signal redelivery is best-effort after the shutdown barrier settles.
            }
          }
        })
      }
    } catch (error) {
      finish()
      reject(error)
    }
  }

  run()
  barrier.catch(() => {})
  return barrier
}

export function registerShutdownParticipant(participant: ShutdownParticipant): () => void {
  const registration = {callback: participant}
  participants.add(registration)
  syncCoordinatorListeners()

  return () => {
    participants.delete(registration)
    syncCoordinatorListeners()
  }
}

export const awaitProcessShutdown = (signal: ShutdownSignal): Promise<void> => requestShutdown(signal)
