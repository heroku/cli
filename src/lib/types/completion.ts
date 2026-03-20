import type {Config} from '@oclif/core/config'
import type * as Interfaces from '@oclif/core/interfaces'

export interface CompletionContext {
  config: Config
  flags?: Record<string, any>
  args?: Record<string, any>
  argv?: string[]
}

export interface Completion {
  cacheDuration?: number
  cacheKey?: (ctx: CompletionContext) => Promise<string> | string
  options: (ctx: CompletionContext) => Promise<string[]> | string[]
  skipCache?: boolean
}

export type FlagInput = Interfaces.FlagInput

