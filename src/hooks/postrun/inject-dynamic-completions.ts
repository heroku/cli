import {Hook} from '@oclif/core/hooks'

/**
 * SPIKE 2 (Option A): after the autocomplete generator writes its scripts,
 * patch them so flag values complete dynamically via `autocomplete:__suggest`.
 *
 * Only the top-level `autocomplete` command and the `autocomplete:create`
 * command (run by the plugin's refresh-cache hook) regenerate the cache, so we
 * guard on those ids. Everything is best-effort — a failure here must never
 * break the command that triggered it.
 */
const GENERATORS = new Set(['autocomplete', 'autocomplete:create'])

const injectDynamicCompletionsHook: Hook<'postrun'> = async function (options) {
  const id = options.Command?.id
  if (!id || !GENERATORS.has(id)) return

  try {
    const {injectDynamicCompletions} = await import('../../lib/autocomplete/inject.js')
    await injectDynamicCompletions(options.config)
  } catch {
    // best-effort: never fail the generator command
  }
}

export default injectDynamicCompletionsHook
