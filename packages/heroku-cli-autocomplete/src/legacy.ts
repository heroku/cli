import { flags as Flags } from '@cli-engine/command'
import { Config, ICommand } from '@cli-engine/config'
import { color } from '@heroku-cli/color'
import { args as Args } from 'cli-flags'
import _ from 'ts-lodash'
import { inspect } from 'util'

import util = require('@cli-engine/engine/lib/util')
import Heroku = require('@heroku-cli/command')
import semver = require('semver')

import { IPluginModule, IPluginTopic } from '@cli-engine/engine/lib/plugins/plugin'

export interface ILegacyTopic {
  id?: string
  name?: string
  topic?: string
}

export interface ILegacyContext {
  version: string
  supportsColor: boolean
  auth: {
    password?: string
  }
  debug: boolean
  debugHeaders: boolean
  flags: { [k: string]: string }
  args: string[] | { [k: string]: string }
  app?: string
  org?: string
  team?: string
  config: Config
  apiUrl: string
  herokuDir: string
  apiToken?: string
  apiHost: string
  gitHost: string
  httpGitHost: string
  cwd: string
}

export interface IFlowCommand {
  id: string
}

export type LegacyCommand = IV5Command | IFlowCommand

export type AnyTopic = IPluginTopic | ILegacyTopic
export type AnyCommand = ICommand | LegacyCommand

export interface IV5Command {
  topic: string
  command?: string
  aliases?: string[]
  variableArgs?: boolean
  args: Args.IArg[]
  flags: ILegacyFlag[]
  description?: string
  help?: string
  usage?: string
  needsApp?: boolean
  wantsApp?: boolean
  needsAuth?: boolean
  needsOrg?: boolean
  wantsOrg?: boolean
  hidden?: boolean
  default?: boolean
  run: (ctx: ILegacyContext) => Promise<any>
}

export interface ILegacyModule {
  topics: AnyTopic[]
  commands: AnyCommand[]
}

export interface ILegacyFlag {
  name: string
  description?: string
  char?: string
  hasValue?: boolean
  hidden?: boolean
  required?: boolean
  optional?: boolean
  parse?: any
}

const debug = require('debug')('cli:legacy')

export class PluginLegacy {
  constructor(_: Config) {}

  public convert(m: IPluginModule | ILegacyModule): IPluginModule {
    m.commands = this.convertCommands(m.commands)
    return m as IPluginModule
  }

  public convertFromV5(c: IV5Command): ICommand {
    class V5 extends Heroku.Command {
      static id = _.compact([c.topic, c.command]).join(':')
      static description = c.description
      static hidden = !!c.hidden
      static args = (c.args || []).map(a => ({
        ...a,
        required: a.required !== false && !(a as any).optional,
      }))
      static flags = convertFlagsFromV5(c.flags)
      static variableArgs = !!c.variableArgs
      static help = c.help
      static aliases = c.aliases || []
      static usage = c.usage

      async run() {
        const ctx: ILegacyContext = {
          version: this.config.userAgent,
          supportsColor: color.enabled,
          auth: {},
          debug: !!this.config.debug,
          debugHeaders: this.config.debug > 1 || ['1', 'true'].includes((process as any).env.HEROKU_DEBUG_HEADERS),
          flags: this.flags,
          args: c.variableArgs ? this.argv : this.args,
          app: this.flags.app,
          org: this.flags.org,
          team: this.flags.team,
          config: this.config,
          apiUrl: Heroku.vars.apiUrl,
          herokuDir: this.config.cacheDir,
          apiToken: this.heroku.auth,
          apiHost: Heroku.vars.apiHost,
          gitHost: Heroku.vars.gitHost,
          httpGitHost: Heroku.vars.httpGitHost,
          cwd: process.cwd(),
        }
        ctx.auth.password = ctx.apiToken
        const ansi = require('ansi-escapes')
        process.once('exit', () => {
          if (process.stderr.isTTY) {
            process.stderr.write(ansi.cursorShow)
          }
        })
        return c.run(ctx)
      }
    }

    if (c.needsApp || c.wantsApp) {
      V5.flags.app = Heroku.flags.app({ required: !!c.needsApp })
      V5.flags.remote = Heroku.flags.remote()
    }
    if (c.needsOrg || c.wantsOrg) {
      let opts = { required: !!c.needsOrg, hidden: false, description: 'organization to use' }
      V5.flags.org = Heroku.flags.org(opts)
    }
    return V5
  }

  private convertCommands(c: AnyCommand[]): ICommand[] {
    return c.map(c => this.convertCommand(c))
  }

  private convertCommand(c: AnyCommand): ICommand {
    if (this.isICommand(c)) return this.convertFromICommand(c)
    if (this.isV5Command(c)) return this.convertFromV5(c)
    if (this.isFlowCommand(c)) return this.convertFromFlow(c)
    debug(c)
    throw new Error(`Invalid command: ${inspect(c)}`)
  }

  private convertFromICommand(c: any): ICommand {
    if (!c.id) c.id = _.compact([c.topic, c.command]).join(':')
    return c
  }

  private convertFromFlow(c: any): ICommand {
    if (!c.id) c.id = _.compact([c.topic, c.command]).join(':')
    c._version = c._version || '0.0.0'
    return c
  }

  private isICommand(command: AnyCommand): command is ICommand {
    let c = command as ICommand
    if (!c._version) return false
    return semver.gte(c._version, '11.0.0')
  }

  private isV5Command(command: AnyCommand): command is IV5Command {
    let c = command
    return !!(typeof c === 'object')
  }

  private isFlowCommand(command: AnyCommand): command is IFlowCommand {
    let c = command as IFlowCommand
    return typeof c === 'function'
    // if (c._version && semver.lt(c._version, '11.0.0')) return true
  }
}

function convertFlagsFromV5(flags: ILegacyFlag[] | Flags.Input | undefined): Flags.Input {
  if (!flags) return {}
  if (!Array.isArray(flags)) return flags
  return flags.reduce(
    (flags, flag) => {
      let opts = {
        char: flag.char,
        description: flag.description,
        hidden: flag.hidden,
        required: flag.required || flag.optional === false,
        parse: flag.parse,
      }
      for (let [k, v] of util.objEntries(opts)) {
        if (v === undefined) delete (opts as any)[k]
      }
      if (!opts.parse) delete opts.parse
      flags[flag.name] = flag.hasValue ? Flags.string(opts as any) : Flags.boolean(opts as any)
      return flags
    },
    {} as Flags.Input,
  )
}
