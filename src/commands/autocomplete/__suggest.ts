import {Command} from '@heroku-cli/command'
import {Args, Interfaces} from '@oclif/core'

import type {CompletionContext} from '../../lib/types/completion.js'

import {CompletionMapping} from '../../lib/autocomplete/completions.js'

/**
 * SPIKE 2 (Option A): dynamic, API-backed value completion.
 *
 * Internal completion callback — the `__` prefix marks it as plumbing, not a
 * command users type (cf. the `__complete` convention in gh/kubectl/docker).
 * The generated shell completion functions invoke it at completion time with
 * the current command line, e.g.:
 *   heroku autocomplete:__suggest 'heroku apps:info --app='
 *
 * It resolves which flag is being completed, looks up a Heroku `Completion`,
 * and prints the live values (one per line) for the shell to offer.
 *
 * Scoped for the spike to flag-value completion backed by the SDK (apps only).
 * Generalizing to args, caching, and the full catalog is Phase 3.
 */
export default class Suggest extends Command {
  static args = {
    line: Args.string({description: 'the current command line being completed'}),
  }
  static description = 'suggest arg or flag completion values for a command line (used internally by completion functions)'
  static hidden = true

  async run() {
    const {args} = await this.parse(Suggest)
    try {
      const flagName = this.flagBeingCompleted(args.line ?? '')
      if (!flagName) return
      const completion = CompletionMapping[flagName]
      if (!completion) return

      const ctx: CompletionContext = {config: this.config}
      const options = await completion.options(ctx)
      if (options.length > 0) this.log(options.join('\n'))
    } catch (error) {
      // completions must never throw into the shell; stay silent — but surface
      // the cause to stderr when debugging (HEROKU_AC_DEBUG=1).
      if (process.env.HEROKU_AC_DEBUG) process.stderr.write(`autocomplete:__suggest error: ${error instanceof Error ? error.message : String(error)}\n`)
    }
  }

  private canonicalFlag(nameOrChar: string, flags: Interfaces.FlagInput): string | undefined {
    if (flags[nameOrChar]) return nameOrChar
    const byChar = Object.keys(flags).find(k => (flags[k] as {char?: string}).char === nameOrChar)
    return byChar
  }

  /**
   * Given a command line, return the canonical name of the flag whose VALUE is
   * being completed, or undefined. Handles `--app=<partial>`, trailing `--app`,
   * and the `-a` short char.
   */
  private flagBeingCompleted(line: string): string | undefined {
    const tokens = line.trim().split(/\s+/)
    const id = tokens[1]
    if (!id) return undefined

    const found = this.config.findCommand(id)
    if (!found) return undefined
    const Klass = found as unknown as {flags?: Interfaces.FlagInput}
    const flags = Klass.flags ?? {}

    const last = tokens.at(-1) ?? ''

    // `--app=<partial>` or `--app=`
    const eq = last.match(/^--([^=]+)=/)
    if (eq) return this.canonicalFlag(eq[1], flags)

    // trailing `--app` / `-a` (value is the next word)
    const dash = last.match(/^--?([^=]+)$/)
    if (dash) return this.canonicalFlag(dash[1], flags)

    // `--app <partial>` — previous token is the flag
    const prev = tokens.at(-2) ?? ''
    const prevDash = prev.match(/^--?([^=]+)$/)
    if (prevDash) return this.canonicalFlag(prevDash[1], flags)

    return undefined
  }
}
