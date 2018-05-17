import {vars} from '@heroku-cli/command'
import {CLIError} from '@oclif/errors'
import * as Config from '@oclif/config'
import ux from 'cli-ux'
import netrc from 'netrc-parser'
import * as path from 'path'

import deps from './deps'

const debug = require('debug')('heroku:analytics')

export interface AnalyticsJSONCommand {
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

export interface AnalyticsJSON {
  schema: 1
  commands: AnalyticsJSONCommand[]
}

export interface AnalyticsJSONPost {
  schema: 1
  commands: AnalyticsJSONCommand[]
  install: string
  cli: string
  user: string
}

export interface RecordOpts {
  Command: Config.Command.Class
  argv: string[]
}

export default class AnalyticsCommand {
  config: Config.IConfig
  userConfig!: typeof deps.UserConfig.prototype
  http: typeof deps.HTTP

  constructor(config: Config.IConfig) {
    this.config = config
    this.http = deps.HTTP.create({
      headers: {'user-agent': config.userAgent},
    })
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
      await deps.file.remove(this.analyticsPath)

      const body: AnalyticsJSONPost = {
        schema: local.schema,
        commands: local.commands,
        user,
        install: this.userConfig.install,
        cli: this.config.name,
      }

      await this.http.post(this.url, {body})
    } catch (err) {
      debug(err)
      await deps.file.remove(this.analyticsPath).catch(err => ux.warn(err))
    }
  }

  get url(): string {
    return process.env.HEROKU_ANALYTICS_URL || 'https://cli-analytics.heroku.com/record'
  }

  get analyticsPath(): string {
    return path.join(this.config.cacheDir, 'analytics.json')
  }

  get usingHerokuAPIKey(): boolean {
    const k = process.env.HEROKU_API_KEY
    return !!(k && k.length > 0)
  }

  get netrcLogin(): string | undefined {
    return netrc.machines[vars.apiHost] && netrc.machines[vars.apiHost].login
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
      if (err.code !== 'ENOENT') debug(err)
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

  async loadNetRc(): Promise<void> {
    try {
      await netrc.load()
    } catch (err) {
      if (err.code === 'EISDIR') {
        throw new CLIError('Problem reading ~/.netrc config, directory found')
      } else {
        throw err
      }
    }
  }

  private async init() {
    await this.loadNetRc()
    this.userConfig = new deps.UserConfig(this.config)
    await this.userConfig.init()
  }
}
