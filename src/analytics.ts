import cli from 'cli-ux'
import deps from './deps'
import { Config } from 'cli-engine-config'
import { HTTP } from 'http-call'
import * as path from 'path'
import { vars } from 'cli-engine-heroku/lib/vars'
import { ICommand } from 'cli-engine-config'

const Netrc = require('netrc-parser')

const debug = require('debug')('heroku:analytics')

type AnalyticsJSONCommand = {
  command: string
  completion: number
  version: string
  plugin: string
  plugin_version: string
  os: string
  shell: string
  language: string
  valid: true
}

type AnalyticsJSON = {
  schema: 1
  commands: AnalyticsJSONCommand[]
}

type AnalyticsJSONPost = {
  schema: 1
  commands: AnalyticsJSONCommand[]
  install: string
  cli: string
  user: string
}

type RecordOpts = {
  Command: ICommand
  argv: string[]
}

export default class AnalyticsCommand {
  config: Config
  userConfig: typeof deps.UserConfig.prototype

  constructor(config: Config) {
    this.config = config
  }

  private async init() {
    this.userConfig = new deps.UserConfig(this.config)
    await this.userConfig.init()
  }

  _initialAnalyticsJSON(): AnalyticsJSON {
    return {
      schema: 1,
      commands: [],
    }
  }

  async record(opts: RecordOpts) {
    await this.init()
    const plugin = opts.Command.plugin
    if (!plugin) {
      debug('no plugin found for analytics')
      return
    }

    if (!this.user) return

    let analyticsJSON = await this._readJSON()

    analyticsJSON.commands.push({
      command: opts.Command.id,
      completion: await this._acAnalytics(),
      version: this.config.version,
      plugin: plugin.name,
      plugin_version: plugin.version,
      os: this.config.platform,
      shell: this.config.shell,
      valid: true,
      language: 'node',
    })

    await this._writeJSON(analyticsJSON)
  }

  async submit() {
    try {
      await this.init()
      let user = this.user
      if (!user) return

      const local: AnalyticsJSON = await this._readJSON()
      if (local.commands.length === 0) return

      const body: AnalyticsJSONPost = {
        schema: local.schema,
        commands: local.commands,
        user: user,
        install: this.userConfig.install,
        cli: this.config.name,
      }

      await HTTP.post(this.url, { body })

      await deps.file.remove(this.analyticsPath)
    } catch (err) {
      debug(err)
      await deps.file.remove(this.analyticsPath).catch(err => cli.warn(err))
    }
  }

  get url(): string {
    return process.env['HEROKU_ANALYTICS_URL'] || 'https://cli-analytics.heroku.com/record'
  }

  get analyticsPath(): string {
    return path.join(this.config.cacheDir, 'analytics.json')
  }

  get usingHerokuAPIKey(): boolean {
    const k = process.env.HEROKU_API_KEY
    return !!(k && k.length > 0)
  }

  get netrcLogin(): string | undefined {
    let netrc = new Netrc()
    return netrc.machines[vars.apiHost].login
  }

  get user(): string | undefined {
    if (this.userConfig.skipAnalytics || this.usingHerokuAPIKey) return
    return this.netrcLogin
  }

  async _readJSON(): Promise<AnalyticsJSON> {
    try {
      let analytics = await deps.file.readJSON(this.analyticsPath)
      analytics.commands = analytics.commands || []
      return analytics
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
      return this._initialAnalyticsJSON()
    }
  }

  async _writeJSON(analyticsJSON: AnalyticsJSON) {
    return deps.file.outputJSON(this.analyticsPath, analyticsJSON)
  }

  async _acAnalytics(): Promise<number> {
    let root = path.join(this.config.cacheDir, 'completions', 'completion_analytics')
    let meta = {
      cmd: deps.file.exists(path.join(root, 'command')),
      flag: deps.file.exists(path.join(root, 'flag')),
      value: deps.file.exists(path.join(root, 'value')),
    }
    let score = 0
    if (await meta.cmd) score += 1
    if (await meta.flag) score += 2
    if (await meta.value) score += 4
    if (await deps.file.exists(root)) await deps.file.remove(root)
    return score
  }
}
