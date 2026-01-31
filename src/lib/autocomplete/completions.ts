import {APIClient} from '@heroku-cli/command'
import {configRemote, getGitRemotes} from '@heroku-cli/command/lib/git.js'
import fs from 'fs-extra'
import pkg from 'lodash'
import * as path from 'path'

import type {Completion, CompletionContext} from '../types/completion.js'

const {flatten} = pkg

export const oneDay = 60 * 60 * 24

export const herokuGet = async (resource: string, ctx: CompletionContext): Promise<string[]> => {
  const heroku = new APIClient(ctx.config)
  let {body} = await heroku.get(`/${resource}`, {retryAuth: false})
  if (typeof body === 'string') body = JSON.parse(body)
  return (body as any[]).map((a: any) => a.name).sort()
}

export const AppCompletion: Completion = {
  cacheDuration: oneDay,
  async options(ctx: CompletionContext) {
    const teams = await herokuGet('teams', ctx)
    const apps = {
      personal: await herokuGet('users/~/apps', ctx),
      teams: flatten(await Promise.all(teams.map((team: string) => herokuGet(`teams/${team}/apps`, ctx)))),
    }
    return apps.personal.concat(apps.teams)
  },
}

export const AppAddonCompletion: Completion = {
  cacheDuration: oneDay,
  async cacheKey(ctx: CompletionContext) {
    return ctx.flags && ctx.flags.app ? `${ctx.flags.app}_addons` : ''
  },
  async options(ctx: CompletionContext) {
    const addons = ctx.flags && ctx.flags.app ? await herokuGet(`apps/${ctx.flags.app}/addons`, ctx) : []
    return addons
  },
}

export const AppDynoCompletion: Completion = {
  cacheDuration: oneDay,
  async cacheKey(ctx: CompletionContext) {
    return ctx.flags && ctx.flags.app ? `${ctx.flags.app}_dynos` : ''
  },
  async options(ctx: CompletionContext) {
    const dynos = ctx.flags && ctx.flags.app ? await herokuGet(`apps/${ctx.flags.app}/dynos`, ctx) : []
    return dynos
  },
}

export const BuildpackCompletion: Completion = {
  async options() {
    return [
      'heroku/ruby',
      'heroku/nodejs',
      'heroku/clojure',
      'heroku/python',
      'heroku/java',
      'heroku/gradle',
      'heroku/scala',
      'heroku/php',
      'heroku/go',
    ]
  },

  skipCache: true,
}

const ConfigCompletion: Completion = {
  cacheDuration: 60 * 60 * 24 * 7,
  async cacheKey(ctx: any) {
    return ctx.flags && ctx.flags.app ? `${ctx.flags.app}_config_vars` : ''
  },
  async options(ctx: any) {
    const heroku = new APIClient(ctx.config)
    if (ctx.flags && ctx.flags.app) {
      const {body: configs} = await heroku.get<{body: Record<string,  any>}>(`/apps/${ctx.flags.app}/config-vars`, {retryAuth: false})
      return Object.keys(configs)
    }

    return []
  },
}

const ConfigSetCompletion: Completion = {
  cacheDuration: 60 * 60 * 24 * 7,
  async cacheKey(ctx: any) {
    return ctx.flags && ctx.flags.app ? `${ctx.flags.app}_config_set_vars` : ''
  },
  async options(ctx: any) {
    const heroku = new APIClient(ctx.config)
    if (ctx.flags && ctx.flags.app) {
      const {body: configs} = await heroku.get<{body: Record<string,  any>}>(`/apps/${ctx.flags.app}/config-vars`, {retryAuth: false})
      return Object.keys(configs).map(k => `${k}=`)
    }

    return []
  },
}

export const DynoSizeCompletion: Completion = {
  cacheDuration: oneDay * 90,
  async options(ctx: CompletionContext) {
    let sizes = await herokuGet('dyno-sizes', ctx)
    if (sizes) sizes = sizes.map(s => s.toLowerCase())
    return sizes
  },
}

export const FileCompletion: Completion = {
  async options() {
    const files = await fs.readdir(process.cwd())
    return files
  },

  skipCache: true,
}

export const PipelineCompletion: Completion = {
  cacheDuration: oneDay,
  async options(ctx: CompletionContext) {
    const pipelines = await herokuGet('pipelines', ctx)
    return pipelines
  },
}

export const ProcessTypeCompletion: Completion = {
  async options() {
    let types: string[] = []
    const procfile = path.join(process.cwd(), 'Procfile')
    try {
      const buff = await fs.readFile(procfile)
      types = buff
        .toString()
        .split('\n')
        .map((s: string) => {
          if (!s) return false
          const m = s.match(/^([A-Za-z0-9_-]+)/)
          return m ? m[0] : false
        })
        .filter((t: false | string): t is string => t !== false) as string[]
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error
    }

    return types
  },

  skipCache: true,
}

export const ProtocolCompletion = {
  cacheDuration: 60 * 60 * 24 * 365,
  async options() {
    return ['tcp', 'udp', 'icmp', '0-255', 'any']
  },
}

export const RegionCompletion: Completion = {
  cacheDuration: oneDay * 7,
  async options(ctx: CompletionContext) {
    const regions = await herokuGet('regions', ctx)
    return regions
  },
}

export const RemoteCompletion: Completion = {
  async options() {
    const remotes = getGitRemotes(configRemote())
    return remotes.map((r: any) => r.remote)
  },

  skipCache: true,
}

export const RoleCompletion: Completion = {
  async options() {
    return ['admin', 'collaborator', 'member', 'owner']
  },

  skipCache: true,
}

export const ScopeCompletion: Completion = {
  async options() {
    return ['global', 'identity', 'read', 'write', 'read-protected', 'write-protected']
  },

  skipCache: true,
}

export const SpaceCompletion: Completion = {
  cacheDuration: oneDay,
  async options(ctx: CompletionContext) {
    const spaces = await herokuGet('spaces', ctx)
    return spaces
  },
}

export const StackCompletion: Completion = {
  cacheDuration: oneDay,
  async options(ctx: CompletionContext) {
    const stacks = await herokuGet('stacks', ctx)
    return stacks
  },
}

export const StageCompletion: Completion = {
  async options() {
    return ['test', 'review', 'development', 'staging', 'production']
  },

  skipCache: true,
}

export const TeamCompletion: Completion = {
  cacheDuration: oneDay,
  async options(ctx: CompletionContext) {
    const teams = await herokuGet('teams', ctx)
    return teams
  },
}

export const CompletionMapping: { [key: string]: Completion } = {
  addon: AppAddonCompletion,
  app: AppCompletion,
  buildpack: BuildpackCompletion,
  config: ConfigCompletion,
  configSet: ConfigSetCompletion,
  dyno: AppDynoCompletion,
  dynosize: DynoSizeCompletion,
  pipeline: PipelineCompletion,
  processtype: ProcessTypeCompletion,
  region: RegionCompletion,
  remote: RemoteCompletion,
  role: RoleCompletion,
  scope: ScopeCompletion,
  space: SpaceCompletion,
  stack: StackCompletion,
  stage: StageCompletion,
  team: TeamCompletion,
}

export class CompletionLookup {
  private readonly blocklistMap: { [key: string]: string[] } = {
    app: ['apps:create'],
    space: ['spaces:create'],
  }

  private readonly commandArgsMap: { [key: string]: { [key: string]: string } } = {
    key: {
      'config:set': 'configSet',
    },
  }

  private readonly keyAliasMap: { [key: string]: { [key: string]: string } } = {
    key: {
      'config:get': 'config',
    },
  }

  constructor(private readonly cmdId: string, private readonly name: string, private readonly description?: string) {}

  run(): Completion | undefined {
    if (this.blocklisted()) return
    return CompletionMapping[this.key]
  }

  private argAlias(): string | undefined {
    return this.commandArgsMap[this.name] && this.commandArgsMap[this.name][this.cmdId]
  }

  private blocklisted(): boolean {
    return this.blocklistMap[this.name] && this.blocklistMap[this.name].includes(this.cmdId)
  }

  private descriptionAlias(): string | undefined {
    const d = this.description!
    if (d.match(/^dyno size/)) return 'dynosize'
    if (d.match(/^process type/)) return 'processtype'
  }

  private get key(): string {
    return this.argAlias() || this.keyAlias() || this.descriptionAlias() || this.name
  }

  private keyAlias(): string | undefined {
    return this.keyAliasMap[this.name] && this.keyAliasMap[this.name][this.cmdId]
  }
}
