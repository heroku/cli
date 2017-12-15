import {cli} from 'cli-ux'
import {color} from 'heroku-cli-color'
import {Config} from 'cli-engine-config'
import {PluginsParseHookOptions} from 'cli-engine/lib/hooks'
import {Command, flags as Flags} from 'cli-engine-heroku'
import {IArg, InputFlags} from 'cli-engine-command'
import {vars} from 'cli-engine-heroku/lib/vars'

export type LegacyContext = {
  version: string
  supportsColor: boolean
  auth: {
    password?: string
  }
  debug: boolean
  debugHeaders: boolean
  flags: {[k: string]: string}
  args: string[] | {[k: string]: string}
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

export type LegacyFlag = {
  name: string,
  description?: string,
  char?: string,
  hasValue?: boolean,
  hidden?: boolean,
  required?: boolean,
  optional?: boolean,
  parse?: any
}

export type LegacyCommand = {
  topic: string,
  command?: string,
  aliases?: string[],
  variableArgs?: boolean,
  args: IArg[],
  flags: LegacyFlag[],
  description?: string,
  help?: string,
  usage?: string,
  needsApp?: boolean,
  wantsApp?: boolean,
  needsAuth?: boolean,
  needsOrg?: boolean,
  wantsOrg?: boolean,
  hidden?: boolean,
  default?: boolean,
  run: (ctx: LegacyContext) => Promise<any>
}

function getID (c: any): string {
  let id = []
  if (c.topic) id.push(c.topic)
  if (c.command) id.push(c.command)
  return id.join(':')
}

module.exports = (_: Config, opts: PluginsParseHookOptions) => {
  const m = opts.module
  m.commands = m.commands.map((c: any) => {
    if (typeof c === 'object') {
      c = convertFromV5(c)
    } else if (!c._version) {
    }
    if (!c.id) c.id = getID(c)
    return c
  })
}

export function convertFromV5 (c: LegacyCommand) {
  class V5 extends Command {
    static topic = c.topic
    static command = c.command
    static description = c.description
    static hidden = !!c.hidden
    static args = c.args || []
    static flags = convertFlagsFromV5(c.flags)
    static variableArgs = !!c.variableArgs
    static help = c.help
    static usage = c.usage

    async run () {
      if (c.aliases && c.aliases.length) {
        cli.warn(`Using aliases: ${c.aliases}`)
      }
      const ctx: LegacyContext = {
        version: this.config.userAgent,
        supportsColor: color.enabled,
        auth: {},
        debug: !!this.config.debug,
        debugHeaders: this.config.debug > 1 || ['1', 'true'].includes((<any>process).env.HEROKU_DEBUG_HEADERS),
        flags: this.flags,
        args: c.variableArgs ? this.argv : this.args,
        app: this.flags.app,
        org: this.flags.org,
        team: this.flags.team,
        config: this.config,
        apiUrl: vars.apiUrl,
        herokuDir: this.config.cacheDir,
        apiToken: this.heroku.auth,
        apiHost: vars.apiHost,
        gitHost: vars.gitHost,
        httpGitHost: vars.httpGitHost,
        cwd: process.cwd()
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
    V5.flags.app = Flags.app({required: !!c.needsApp})
    V5.flags.remote = Flags.remote()
  }
  if (c.needsOrg || c.wantsOrg) {
    let opts = {required: !!c.needsOrg, hidden: false, description: 'organization to use'}
    V5.flags.org = Flags.org(opts)
  }
  return V5
}

function convertFlagsFromV5 (flags: LegacyFlag[] | InputFlags | undefined): InputFlags {
  if (!flags) return {}
  if (!Array.isArray(flags)) return flags
  return flags.reduce((flags, flag) => {
    let opts = {
      char: flag.char,
      description: flag.description,
      hidden: flag.hidden,
      required: flag.required || flag.optional === false,
      parse: flag.parse
    }
    for (let [k, v] of Object.entries(opts)) {
      if (v === undefined) delete (<any>opts)[k]
    }
    if (!opts.parse) delete opts.parse
    flags[flag.name] = flag.hasValue ? Flags.string(opts as any) : Flags.boolean(opts as any)
    return flags
  }, {} as InputFlags)
}
