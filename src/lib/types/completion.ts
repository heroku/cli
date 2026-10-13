import type {Config} from '@oclif/core'

export interface CompletionContext {
  /**
   * The `--app` value present on the command line being completed, when the
   * generated script could extract one (zsh `$opt_args[--app]`, bash a
   * `COMP_WORDS` scan). App-scoped completions (e.g. dyno names) list that app's
   * resources; `undefined` when no app is on the line yet, in which case they
   * offer nothing rather than erroring.
   */
  app?: string
  args?: Record<string, any>
  argv?: string[]
  config: Config
  flags?: Record<string, any>
}

export interface Completion {
  cacheDuration?: number
  cacheKey?: (ctx: CompletionContext) => Promise<string> | string
  options: (ctx: CompletionContext) => Promise<string[]> | string[]
  skipCache?: boolean
}
