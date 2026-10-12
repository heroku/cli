import {Command} from '@heroku-cli/command'
import {Flags} from '@oclif/core'

import type {Completion, CompletionContext} from '../../lib/types/completion.js'

import {cachedValues} from '../../lib/autocomplete/cache.js'
import {completionsByFlag} from '../../lib/autocomplete/completions.js'

/**
 * Dynamic, API-backed value completion.
 *
 * Internal completion callback — the `__` prefix marks it as plumbing, not a
 * command users type (cf. the `__complete` convention in gh/kubectl/docker).
 * The generated shell completion functions invoke it at completion time, naming
 * the flag whose value is being completed:
 *
 *   heroku autocomplete:__suggest --flag app
 *
 * Protocol (frozen — the generated scripts in src/lib/autocomplete/inject.ts
 * depend on it): a single `--flag <canonical-long-name>` option; values are one
 * per line on stdout; anything else goes to stderr. The shell already knows which
 * flag it is completing, so this command never parses the command line — that is
 * what keeps bash immune to COMP_WORDBREAKS splitting `apps:info` into tokens.
 *
 * `strict = false` and the optional flag make a stale script (CLI upgraded but
 * `heroku autocomplete` not re-run) degrade to no suggestions rather than erroring.
 */
export default class Suggest extends Command {
  static description = 'suggest flag completion values (used internally by completion functions)'
  static flags = {
    flag: Flags.string({description: 'canonical (long) name of the flag whose values to suggest'}),
  }
  static hidden = true
  static strict = false

  async run() {
    try {
      const {flags} = await this.parse(Suggest)
      if (!flags.flag || !Object.hasOwn(completionsByFlag, flags.flag)) return
      const completion = completionsByFlag[flags.flag]

      const ctx: CompletionContext = {config: this.config}
      const values = await this.resolveValues(flags.flag, completion, ctx)
      if (values.length > 0) this.log(values.join('\n'))
    } catch (error) {
      // completions must never throw into the shell; stay silent — but surface
      // the cause to stderr when debugging (HEROKU_AC_DEBUG=1).
      if (process.env.HEROKU_AC_DEBUG) {
        process.stderr.write(`autocomplete:__suggest error: ${error instanceof Error ? error.message : String(error)}\n`)
      }
    }
  }

  private async resolveValues(flag: string, completion: Completion, ctx: CompletionContext): Promise<string[]> {
    const compute = () => Promise.resolve(completion.options(ctx))
    if (!completion.cacheDuration || completion.skipCache) return compute()

    const key = (await completion.cacheKey?.(ctx)) ?? flag
    return cachedValues(this.config.cacheDir, key, completion.cacheDuration, compute)
  }
}
