import {APIClient} from '@heroku-cli/command'
import {deps} from '@heroku-cli/command/lib/deps'
import {configRemote, getGitRemotes} from '@heroku-cli/command/lib/git'
import {Interfaces} from '@oclif/core'
import * as path from 'path'
import flatten = require('lodash.flatten')

export const oneDay = 60 * 60 * 24

export const herokuGet = async (resource: string, ctx: Interfaces.CompletionContext): Promise<string[]> => {
  const heroku = new APIClient(ctx.config)
  let {body} = await heroku.get(`/${resource}`, {retryAuth: false})
  if (typeof body === 'string') body = JSON.parse(body)
  return (body as any[]).map((a: any) => a.name).sort()
}

export const AppCompletion: Interfaces.Completion = {
  cacheDuration: oneDay,
  options: async ctx => {
    const teams = await herokuGet('teams', ctx)
    const apps = {
      personal: await herokuGet('users/~/apps', ctx),
      teams: flatten(await Promise.all(teams.map((team: string) => herokuGet(`teams/${team}/apps`, ctx)))),
    }
    return apps.personal.concat(apps.teams)
  },
}

export const AppAddonCompletion: Interfaces.Completion = {
  cacheDuration: oneDay,
  cacheKey: async ctx => {
    return ctx.flags && ctx.flags.app ? `${ctx.flags.app}_addons` : ''
  },
  options: async ctx => {
    const addons = ctx.flags && ctx.flags.app ? await herokuGet(`apps/${ctx.flags.app}/addons`, ctx) : []
    return addons
  },
}

export const AppDynoCompletion: Interfaces.Completion = {
  cacheDuration: oneDay,
  cacheKey: async ctx => {
    return ctx.flags && ctx.flags.app ? `${ctx.flags.app}_dynos` : ''
  },
  options: async ctx => {
    const dynos = ctx.flags && ctx.flags.app ? await herokuGet(`apps/${ctx.flags.app}/dynos`, ctx) : []
    return dynos
  },
}

export const BuildpackCompletion: Interfaces.Completion = {
  skipCache: true,

  options: async () => {
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
}

const ConfigCompletion: Interfaces.Completion = {
  cacheDuration: 60 * 60 * 24 * 7,
  cacheKey: async (ctx: any) => {
    return ctx.flags && ctx.flags.app ? `${ctx.flags.app}_config_vars` : ''
  },
  options: async (ctx: any) => {
    const heroku = new APIClient(ctx.config)
    if (ctx.flags && ctx.flags.app) {
      const {body: configs} = await heroku.get<{body: Record<string,  any>}>(`/apps/${ctx.flags.app}/config-vars`, {retryAuth: false})
      return Object.keys(configs)
    }

    return []
  },
}

const ConfigSetCompletion: Interfaces.Completion = {
  cacheDuration: 60 * 60 * 24 * 7,
  cacheKey: async (ctx: any) => {
    return ctx.flags && ctx.flags.app ? `${ctx.flags.app}_config_set_vars` : ''
  },
  options: async (ctx: any) => {
    const heroku = new APIClient(ctx.config)
    if (ctx.flags && ctx.flags.app) {
      const {body: configs} = await heroku.get<{body: Record<string,  any>}>(`/apps/${ctx.flags.app}/config-vars`, {retryAuth: false})
      return Object.keys(configs).map(k => `${k}=`)
    }

    return []
  },
}

export const DynoSizeCompletion: Interfaces.Completion = {
  cacheDuration: oneDay * 90,
  options: async ctx => {
    let sizes = await herokuGet('dyno-sizes', ctx)
    if (sizes) sizes = sizes.map(s => s.toLowerCase())
    return sizes
  },
}

export const FileCompletion: Interfaces.Completion = {
  skipCache: true,

  options: async () => {
    const files = await deps.file.readdir(process.cwd())
    return files
  },
}

export const PipelineCompletion: Interfaces.Completion = {
  cacheDuration: oneDay,
  options: async ctx => {
    const pipelines = await herokuGet('pipelines', ctx)
    return pipelines
  },
}

export const ProcessTypeCompletion: Interfaces.Completion = {
  skipCache: true,

  options: async () => {
    let types: string[] = []
    const procfile = path.join(process.cwd(), 'Procfile')
    try {
      const buff = await deps.file.readFile(procfile)
      types = buff
        .toString()
        .split('\n')
        .map(s => {
          if (!s) return false
          const m = s.match(/^([A-Za-z0-9_-]+)/)
          return m ? m[0] : false
        })
        .filter(t => t) as string[]
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error
    }

    return types
  },
}

export const RegionCompletion: Interfaces.Completion = {
  cacheDuration: oneDay * 7,
  options: async ctx => {
    const regions = await herokuGet('regions', ctx)
    return regions
  },
}

export const RemoteCompletion: Interfaces.Completion = {
  skipCache: true,

  options: async () => {
    const remotes = getGitRemotes(configRemote())
    return remotes.map(r => r.remote)
  },
}

export const RoleCompletion: Interfaces.Completion = {
  skipCache: true,

  options: async () => {
    return ['admin', 'collaborator', 'member', 'owner']
  },
}

export const ScopeCompletion: Interfaces.Completion = {
  skipCache: true,

  options: async () => {
    return ['global', 'identity', 'read', 'write', 'read-protected', 'write-protected']
  },
}

export const SpaceCompletion: Interfaces.Completion = {
  cacheDuration: oneDay,
  options: async ctx => {
    const spaces = await herokuGet('spaces', ctx)
    return spaces
  },
}

export const StackCompletion: Interfaces.Completion = {
  cacheDuration: oneDay,
  options: async ctx => {
    const stacks = await herokuGet('stacks', ctx)
    return stacks
  },
}

export const StageCompletion: Interfaces.Completion = {
  skipCache: true,

  options: async () => {
    return ['test', 'review', 'development', 'staging', 'production']
  },
}

export const TeamCompletion: Interfaces.Completion = {
  cacheDuration: oneDay,
  options: async ctx => {
    const teams = await herokuGet('teams', ctx)
    return teams
  },
}

export const CompletionMapping: { [key: string]: Interfaces.Completion } = {
  app: AppCompletion,
  addon: AppAddonCompletion,
  dyno: AppDynoCompletion,
  buildpack: BuildpackCompletion,
  config: ConfigCompletion,
  configSet: ConfigSetCompletion,
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
  private get key(): string {
    return this.argAlias() || this.keyAlias() || this.descriptionAlias() || this.name
  }

  private readonly blocklistMap: { [key: string]: string[] } = {
    app: ['apps:create'],
    space: ['spaces:create'],
  }

  private readonly keyAliasMap: { [key: string]: { [key: string]: string } } = {
    key: {
      'config:get': 'config',
    },
  }

  private readonly commandArgsMap: { [key: string]: { [key: string]: string } } = {
    key: {
      'config:set': 'configSet',
    },
  }

  // eslint-disable-next-line no-useless-constructor
  constructor(private readonly cmdId: string, private readonly name: string, private readonly description?: string) {}

  run(): Interfaces.Completion | undefined {
    if (this.blocklisted()) return
    return CompletionMapping[this.key]
  }

  private argAlias(): string | undefined {
    return this.commandArgsMap[this.name] && this.commandArgsMap[this.name][this.cmdId]
  }

  private keyAlias(): string | undefined {
    return this.keyAliasMap[this.name] && this.keyAliasMap[this.name][this.cmdId]
  }

  private descriptionAlias(): string | undefined {
    const d = this.description!
    // eslint-disable-next-line unicorn/prefer-starts-ends-with
    if (d.match(/^dyno size/)) return 'dynosize'
    // eslint-disable-next-line unicorn/prefer-starts-ends-with
    if (d.match(/^process type/)) return 'processtype'
  }

  private blocklisted(): boolean {
    return this.blocklistMap[this.name] && this.blocklistMap[this.name].includes(this.cmdId)
  }
}
