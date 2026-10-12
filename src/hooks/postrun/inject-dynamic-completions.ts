import {Hook} from '@oclif/core/hooks'

/**
 * After the autocomplete generator writes its scripts, patch them so flag values
 * complete dynamically via `autocomplete:__suggest`.
 *
 * Only the top-level `autocomplete` command and the `autocomplete:create`
 * command (run by the plugin's refresh-cache hook) regenerate the cache, so we
 * guard on those ids. Everything is best-effort — a failure here must never
 * break the command that triggered it.
 */
const COMPLETION_GENERATOR_IDS = new Set(['autocomplete', 'autocomplete:create'])

const injectDynamicCompletionsHook: Hook<'postrun'> = async function (options) {
  const id = options.Command?.id
  if (!id || !COMPLETION_GENERATOR_IDS.has(id)) return

  try {
    const {injectDynamicCompletions} = await import('../../lib/autocomplete/inject.js')
    await injectDynamicCompletions(options.config)
  } catch (error) {
    // best-effort: never fail the generator command. Surface the cause when
    // debugging (HEROKU_AC_DEBUG=1).
    if (process.env.HEROKU_AC_DEBUG) {
      process.stderr.write(`inject-dynamic-completions error: ${error instanceof Error ? error.message : String(error)}\n`)
    }
  }
}

export default injectDynamicCompletionsHook
