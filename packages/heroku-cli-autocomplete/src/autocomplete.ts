import { Config } from '@cli-engine/engine/lib/config'
import { Plugins } from '@cli-engine/engine/lib/plugins'
import { Plugin } from '@cli-engine/engine/lib/plugins/plugin'
import Command, { APIClient, flags } from '@heroku-cli/command'
import * as Completions from '@heroku-cli/command/lib/completions'
import { AppCompletion, RemoteCompletion } from '@heroku-cli/command/lib/flags/app'
import StreamOutput from 'cli-ux/lib/stream'
import * as moment from 'moment'
import * as path from 'path'

const ConfigCompletion: flags.ICompletion = {
  cacheDuration: 60 * 60 * 24 * 7,
  cacheKey: async (ctx: any) => {
    return ctx.flags && ctx.flags.app ? `${ctx.flags.app}_config_vars` : ''
  },
  options: async (ctx: any) => {
    const heroku = new APIClient(ctx.config)
    if (ctx.flags && ctx.flags.app) {
      let { body: configs } = await heroku.get(`/apps/${ctx.flags.app}/config-vars`)
      return Object.keys(configs)
    }
    return []
  },
}

const CompletionMapping: { [key: string]: flags.ICompletion } = {
  app: AppCompletion,
  addon: Completions.AppAddonCompletion,
  dyno: Completions.AppDynoCompletion,
  buildpack: Completions.BuildpackCompletion,
  config: ConfigCompletion,
  // dynosize: Completions.DynoSizeCompletion,
  // file: Completions.FileCompletion,
  pipeline: Completions.PipelineCompletion,
  // processtype: Completions.ProcessTypeCompletion,
  region: Completions.RegionCompletion,
  remote: RemoteCompletion,
  role: Completions.RoleCompletion,
  scope: Completions.ScopeCompletion,
  space: Completions.SpaceCompletion,
  stack: Completions.StackCompletion,
  stage: Completions.StageCompletion,
  team: Completions.TeamCompletion,
}

const CompletionBlacklist: { [key: string]: string[] } = {
  app: ['apps:create'],
}

const CompletionAliases: { [key: string]: string } = {
  key: 'config',
}

export abstract class AutocompleteBase extends Command {
  public errorIfWindows() {
    if (this.config.windows) {
      throw new Error('Autocomplete is not currently supported in Windows')
    }
  }

  public get completionsCachePath(): string {
    return path.join(this.config.cacheDir, 'completions')
  }

  public get acLogfile(): string {
    return path.join(this.config.cacheDir, 'autocomplete.log')
  }

  writeLogFile(msg: string) {
    StreamOutput.logToFile(`[${moment().format()}] ${msg}\n`, this.acLogfile)
  }

  protected async plugins(): Promise<Plugin[]> {
    const config = new Config(this.config)
    return await new Plugins(config).list()
  }

  protected findCompletion(name: string, id: string): flags.ICompletion | undefined {
    if (this.blacklisted(name, id)) return
    const alias = this.convertIfAlias(name)
    if (CompletionMapping[alias]) return CompletionMapping[alias]
  }

  private blacklisted(name: string, id: string): boolean {
    return CompletionBlacklist[name] && CompletionBlacklist[name].includes(id)
  }

  private convertIfAlias(name: string): string {
    let alias = CompletionAliases[name]
    if (alias) return alias
    return name
  }
}
