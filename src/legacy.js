// @flow

import {type Arg, type Flag} from 'cli-engine-config'
import {Command, flags as Flags} from 'cli-engine-heroku'
import vars from 'cli-engine-heroku/lib/vars'

export type LegacyContext = {
  supportsColor: boolean
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
  args: Arg[],
  flags: LegacyFlag[],
  description?: ?string,
  help?: ?string,
  usage?: ?string,
  needsApp?: ?boolean,
  needsAuth?: ?boolean,
  needsOrg?: ?boolean,
  hidden?: ?boolean,
  default?: ?boolean,
  run: (ctx: LegacyContext) => Promise<any>
}

export function convertFromV5 (c: LegacyCommand) {
  class V5 extends Command {
    static topic = c.topic
    static command = c.command
    static description = c.description
    static hidden = !!c.hidden
    static args = c.args || []
    static flags = convertFlagsFromV5(c.flags, c)
    static variableArgs = !!c.variableArgs
    static help = c.help
    static usage = c.usage
    static aliases = c.aliases || []

    run () {
      let flags: any = this.flags
      let args: (string[] | {[k: string]: string}) = this.argv
      if (!c.variableArgs) {
        // turn args into object v5 expects
        args = {}
        for (let i = 0; i < this.argv.length; i++) {
          args[this.constructor.args[i].name] = this.argv[i]
        }
      }
      const ctx = {
        version: this.config.userAgent,
        supportsColor: this.out.color.enabled,
        auth: {},
        debug: this.config.debug,
        debugHeaders: this.config.debug > 1 || ['1', 'true'].includes(process.env.HEROKU_DEBUG_HEADERS),
        flags,
        args,
        app: flags.app,
        org: flags.org,
        team: flags.team,
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

  return V5
}

function convertFlagsFromV5 (flags: ?(LegacyFlag[] | {[name: string]: Flag}), Cmd: LegacyCommand): {[name: string]: any} {
  if (!flags) {
    flags = {}
  } else if (Array.isArray(flags)) {
    flags = flags.reduce((flags, flag) => {
      let opts: Flag = {
        char: (flag.char: any),
        description: flag.description,
        hidden: flag.hidden,
        required: flag.required,
        optional: flag.optional,
        parse: flag.parse
      }
      Object.keys(opts).forEach(k => opts[k] === undefined && delete opts[k])
      flags[flag.name] = flag.hasValue ? Flags.string(opts) : Flags.boolean((opts: any))
      return flags
    }, {})
  }

  if (Cmd.needsApp || Cmd.wantsApp) {
    flags.app = Flags.app({required: !!Cmd.needsApp})
    flags.remote = Flags.remote()
  }
  if (Cmd.needsOrg || Cmd.wantsOrg) {
    let opts = {required: !!Cmd.needsOrg, hidden: false, description: 'organization to use'}
    flags.org = Flags.org(opts)
  }
  return flags
}
