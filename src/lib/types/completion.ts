import type {Config} from '@oclif/core'

export interface CompletionContext {
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
