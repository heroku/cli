import * as fs from 'fs-extra'
import {Config, ICommand} from 'cli-engine-config'
import {HTTP} from 'http-call'
import * as path from 'path'
import {vars} from 'cli-engine-heroku'

const Netrc = require('netrc-parser')

const debug = require('debug')('heroku:analytics')

export type AnalyticsJSONCommand = {
  command: string,
  completion: number,
  version: string,
  plugin: string,
  plugin_version: string,
  os: string,
  shell: string,
  language: string,
  valid: true
}

export type AnalyticsJSON = {
  schema: 1,
  commands: AnalyticsJSONCommand[]
}

type AnalyticsJSONPost = {
  schema: 1,
  commands: AnalyticsJSONCommand[],
  install: string | undefined
  user: string
  cli: 'heroku'
}

export type RecordOpts = {
  command: ICommand
  argv: string[],
}

export class Analytics {
  config: Config

  constructor (config: Config) {
    this.config = config
  }

  _initialAnalyticsJSON (): AnalyticsJSON {
    return {
      schema: 1,
      commands: []
    }
  }

  async record (opts: RecordOpts) {
    const plugin = opts.command.__config.plugin
    if (!plugin) {
      debug('no plugin found for analytics')
      return
    }
    if (!opts.command.__config.id) {
      debug('no command id found for analytics')
      return
    }

    if (!this.user) return

    let analyticsJSON = await this._readJSON()

    analyticsJSON.commands.push({
      command: opts.command.__config.id,
      completion: await this._acAnalytics(),
      version: this.config.version,
      plugin: plugin.name,
      plugin_version: plugin.version,
      os: this.config.platform,
      shell: this.config.shell,
      valid: true,
      language: 'node'
    })

    await this._writeJSON(analyticsJSON)
  }

  async submit () {
    try {
      let user = this.user
      if (!user) return

      const local: AnalyticsJSON = await this._readJSON()
      if (local.commands.length === 0) return

      const body: AnalyticsJSONPost = {
        schema: local.schema,
        commands: local.commands,
        user: user,
        install: this.config.install,
        cli: 'heroku',
      }

      await HTTP.post(this.url, {body})

      local.commands = []
      await this._writeJSON(local)
    } catch (err) {
      debug(err)
      await this._writeJSON(this._initialAnalyticsJSON())
    }
  }

  get url (): string {
    return process.env['CLI_ENGINE_ANALYTICS_URL'] || 'https://cli-analytics.heroku.com/record'
  }

  get analyticsPath (): string { return path.join(this.config.cacheDir, 'analytics.json') }

  get usingHerokuAPIKey (): boolean {
    let apikey = process.env.HEROKU_API_KEY
    return !!(apikey && apikey.length > 0)
  }

  get netrcLogin (): string | undefined {
    let netrc = new Netrc()
    return netrc.machines[vars.apiHost].login
  }

  get user (): string | undefined {
    if (this.config.skipAnalytics || this.usingHerokuAPIKey) return
    return this.netrcLogin
  }

  async _readJSON (): Promise<AnalyticsJSON> {
    try {
      let analytics = await fs.readJson(this.analyticsPath)
      analytics.commands = analytics.commands || []
      return analytics
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
      return this._initialAnalyticsJSON()
    }
  }

  async _writeJSON (analyticsJSON: AnalyticsJSON) {
    return fs.outputJson(this.analyticsPath, analyticsJSON)
  }

  _acAnalyticsPath (type: string): string {
    return path.join(this.config.cacheDir, 'completion_analytics', type)
  }

  async _acAnalytics (): Promise<number> {
    let meta = {
      cmd: fs.existsSync(this._acAnalyticsPath('command')),
      flag: fs.existsSync(this._acAnalyticsPath('flag')),
      value: fs.existsSync(this._acAnalyticsPath('value'))
    }
    let score = 0
    if (meta.cmd) score += 1
    if (meta.flag) score += 2
    if (meta.value) score += 4
    await fs.emptyDir(this._acAnalyticsPath(''))
    return score
  }
}
