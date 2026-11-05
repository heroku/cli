import type {AddOn} from '@heroku/types/3.sdk'
import type {PostgresWaitStatusResult} from '@heroku/types/data'

import * as color from '@heroku/heroku-cli-util/color'
import {AddonConfirmationRequiredError} from '@heroku/sdk/resources/platform/add-on'
import {ux} from '@oclif/core/ux'

import ConfirmCommand from '../confirm-command.js'

export type ProvisionHooks = {
  onPoll: (status: PostgresWaitStatusResult) => void
  onProvisioning: (addon: AddOn) => void
  /**
   * Fired by `fork` once the source is resolved and tier-checked. Used to start
   * the deferred create spinner (see `resolvedActionStartMessage`); a no-op for
   * `provisionAdvanced`, which never fires it.
   */
  onResolved: (source: AddOn) => void
  wait: boolean
}

export type ProvisionInteractivelyOptions = {
  /** Spinner text for the initial create phase. */
  actionStartMessage: string
  /** Spinner completion text when the create request returns. */
  actionStopMessage: string
  /** Target app, used as the `confirm` value when retrying after a prompt. */
  app: string
  /** Confirmation value supplied by the user (`--confirm`), if any. */
  confirm: string | undefined
  /**
   * For callers that resolve a source before creating (`fork`): when provided,
   * the create spinner is not started up front but deferred to the SDK's
   * `onResolved` hook and started with the message this returns from the
   * resolved source — so the spinner never appears before a tier-check failure
   * and names the resolved add-on rather than the raw identity. Omit it
   * (`provisionAdvanced`) to start the spinner immediately with
   * `actionStartMessage`.
   */
  resolvedActionStartMessage?: (source: AddOn) => string
  /** Poll the data `wait_status` until the leader is ready before returning. */
  wait: boolean
}

function formatConfigVarsMessage(addon: AddOn): string {
  const configVars = addon.config_vars || []

  if (configVars.length > 0) {
    return `Created ${color.addon(addon.name || '')} as ${configVars.map(c => color.name(c)).join(', ')}`
  }

  return `Created ${color.addon(addon.name || '')}`
}

/**
 * Wraps a `data.postgres.provisionAdvanced` / `.fork` call with the CLI
 * provisioning UX that the shared `createAddon` helper provides for generic
 * add-ons, but driven by the Postgres SDK's `onProvisioning`/`onPoll` hooks and
 * data `wait_status` polling. The caller supplies a `provision` thunk that
 * performs the SDK call with the given confirmation value and hooks; this
 * helper owns:
 *
 * - the `confirmation_required` retry loop (prompt, then retry with
 *   `confirm = app`), which must live in the CLI because it prompts;
 * - the two-phase spinner choreography (create phase → "Waiting for …" → wait
 *   phase) when `wait` is set; and
 * - the non-wait output (provision message + "being created in the background"
 *   guidance) and wait output (config-vars summary).
 *
 * Returns whatever the thunk returns (e.g. `{addon, pool?}` or
 * `{addon, source}`) so the caller can render resource-specific follow-ups.
 *
 * The SDK provision methods capture a post-creation failure (a failed wait or
 * follower-pool create) on the resolved result rather than throwing, so the
 * created add-on isn't lost. This helper re-surfaces that as a thrown error so
 * callers keep their existing failure handling; `result` is only returned when
 * provisioning fully succeeded.
 */
export default async function provisionInteractively<T extends {addon: AddOn; poolError?: unknown; waitError?: unknown}>(
  {actionStartMessage, actionStopMessage, app, confirm, resolvedActionStartMessage, wait}: ProvisionInteractivelyOptions,
  provision: (confirm: string | undefined, hooks: ProvisionHooks) => Promise<T>,
): Promise<T> {
  // When the caller resolves a source first (`fork`), defer the create spinner
  // to `onResolved` so it never shows before a tier-check rejection and is
  // labelled from the resolved add-on; otherwise (`provisionAdvanced`) start it
  // immediately below.
  const deferStart = resolvedActionStartMessage !== undefined

  // Two-phase UX during a wait: the create-phase action wraps the initial
  // create; `onProvisioning` closes it, prints the provision message, then
  // opens a second action that wraps the data `wait_status` poll loop and is
  // closed once the thunk returns.
  let inWaitPhase = false
  const hooks: ProvisionHooks = {
    onPoll(status) {
      ux.action.status = status.message || undefined
    },
    onProvisioning(created) {
      ux.action.stop(actionStopMessage)
      if (created.provision_message) {
        ux.stdout(created.provision_message)
      }

      ux.stdout(`Waiting for ${color.addon(created.name || '')}...`)
      ux.action.start(`Creating ${color.addon(created.name || '')}`)
      inWaitPhase = true
    },
    onResolved(source) {
      // Only `fork` fires this; start the deferred create spinner now that the
      // tier check has passed, labelled from the resolved source.
      if (resolvedActionStartMessage) {
        ux.action.start(resolvedActionStartMessage(source))
      }
    },
    wait,
  }

  if (!deferStart) {
    ux.action.start(actionStartMessage)
  }

  let result: T
  try {
    try {
      result = await provision(confirm, hooks)
    } catch (error) {
      if (error instanceof AddonConfirmationRequiredError) {
        ux.action.stop(color.red('!'))
        await new ConfirmCommand().confirm(app, confirm, error.message)
        // A deferred caller re-fires `onResolved` on retry, which restarts the
        // spinner; a non-deferred caller restarts it here.
        if (!deferStart) {
          ux.action.start(actionStartMessage)
        }

        result = await provision(app, hooks)
      } else {
        throw error
      }
    }
  } catch (error) {
    ux.action.stop(color.red('!'))
    throw error
  }

  // `provisionAdvanced`/`fork` no longer throw once the add-on exists: a failed
  // `wait_status` poll or follower-pool create is reported on the result
  // (`waitError`/`poolError`) so the SDK doesn't discard the created leader.
  // The CLI still treats either as a provisioning failure — close whichever
  // spinner phase is open and rethrow the captured cause, matching today's
  // behavior where these surfaced as a thrown error. Both are typed `unknown`;
  // the SDK always captures an `Error`, but normalize defensively so a stray
  // non-`Error` cause still throws a real `Error`.
  const postCreateError = result.waitError ?? result.poolError
  if (postCreateError !== undefined) {
    ux.action.stop(color.red('!'))
    throw postCreateError instanceof Error ? postCreateError : new Error(String(postCreateError))
  }

  const {addon} = result
  if (inWaitPhase) {
    // Closes the wait-phase action started in onProvisioning.
    ux.action.stop()
    ux.stdout(formatConfigVarsMessage(addon))
  } else {
    // No two-phase: close the create-phase action and surface guidance.
    ux.action.stop(actionStopMessage)

    if (addon.provision_message) {
      ux.stdout(addon.provision_message)
    }

    if (addon.state === 'provisioning') {
      ux.stdout(`${color.addon(addon.name || '')} is being created in the background. The app will restart when complete...`)
      ux.stdout(`Run ${color.code('heroku data:pg:info ' + addon.name + ' -a ' + addon.app!.name)} to check creation progress.`)
    } else {
      ux.stdout(formatConfigVarsMessage(addon))
    }
  }

  return result
}
