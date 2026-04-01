import {vars} from '@heroku-cli/command'
import {Command, Interfaces} from '@oclif/core'
import fs from 'fs-extra'
import * as path from 'path'

import deps from '../../deps.js'
import {telemetryDebug} from './telemetry-utils.js'

export interface AnalyticsInterface {
  event: string;
  properties: {
    cli: string;
    command: string;
    completion: number;
    install_id: string;
    language: string;
    os: string;
    plugin: string;
    plugin_version: string;
    shell: string;
    valid: boolean;
    version: string;
  };
  source: string;
}

export interface RecordOpts {
  argv: string[];
  Command: Command.Class;
}

export default class BackboardHerokulyticsClient {
  config: Interfaces.Config

  http: typeof deps.HTTP

  userConfig!: typeof deps.UserConfig.prototype

  private isInitialized = false
  private netrc: any

  constructor(config: Interfaces.Config) {
    this.config = config
    this.http = deps.HTTP.create({
      headers: {'user-agent': config.userAgent},
    })
  }

  get authorizationToken(): string | undefined {
    return process.env.HEROKU_API_KEY || this.netrcToken
  }

  get netrcLogin(): string | undefined {
    return this.netrc?.machines[vars.apiHost]?.login
  }

  get netrcToken(): string | undefined {
    return this.netrc?.machines[vars.apiHost]?.password
  }

  get url(): string {
    return process.env.HEROKU_ANALYTICS_URL || 'https://backboard.heroku.com/hamurai'
  }

  get user(): string | undefined {
    if (this.usingHerokuAPIKey) return
    return this.netrcLogin
  }

  get usingHerokuAPIKey(): boolean {
    const k = process.env.HEROKU_API_KEY
    return Boolean(k && k.length > 0)
  }

  async _acAnalytics(id: string): Promise<number> {
    if (id === 'autocomplete:options') return 0
    const root = path.join(this.config.cacheDir, 'autocomplete', 'completion_analytics')
    const meta = {
      cmd: fs.pathExists(path.join(root, 'command')),
      flag: fs.pathExists(path.join(root, 'flag')),
      value: fs.pathExists(path.join(root, 'value')),
    }
    let score = 0
    if (await meta.cmd) score += 1
    if (await meta.flag) score += 2
    if (await meta.value) score += 4
    if (await fs.pathExists(root)) await fs.remove(root)
    return score
  }

  async send(opts: RecordOpts) {
    await this.ensureInitialized()
    const mcpMode = process.env.HEROKU_MCP_MODE === 'true'
    const mcpServerVersion = process.env.HEROKU_MCP_SERVER_VERSION || 'unknown'
    const {id, plugin} = opts.Command
    if (!plugin) {
      telemetryDebug('No plugin found for Herokulytics analytics')
      return
    }

    if (this.userConfig.skipAnalytics) {
      telemetryDebug('Analytics skipped (user config)')
      return
    }

    const analyticsData: AnalyticsInterface = {
      event: id,
      properties: {
        cli: this.config.name,
        command: id,
        completion: await this._acAnalytics(id),
        install_id: this.userConfig.install,
        language: 'node',
        os: this.config.platform,
        plugin: plugin.name,
        plugin_version: plugin.version,
        shell: this.config.shell,
        valid: true,
        version: `${this.config.version}${mcpMode ? ` (MCP ${mcpServerVersion})` : ''}`,
      },
      source: 'cli',
    }

    telemetryDebug('Herokulytics payload: %O', {
      command: analyticsData.event,
      install_id: analyticsData.properties.install_id,
      plugin: analyticsData.properties.plugin,
      version: analyticsData.properties.version,
    })

    const data = Buffer.from(JSON.stringify(analyticsData)).toString('base64')
    telemetryDebug('Sending to Herokulytics endpoint: %s', this.url)

    if (this.authorizationToken) {
      return this.http.get(`${this.url}?data=${data}`, {headers: {authorization: `Bearer ${this.authorizationToken}`}})
        .then(() => telemetryDebug('Successfully sent Herokulytics data'))
        .catch(error => telemetryDebug('Error sending to Herokulytics: %O', error))
    }

    return this.http.get(`${this.url}?data=${data}`)
      .then(() => telemetryDebug('Successfully sent Herokulytics data'))
      .catch(error => telemetryDebug('Error sending to Herokulytics: %O', error))
  }

  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    telemetryDebug('Initializing Herokulytics client...')
    this.isInitialized = true

    const NetrcModule = await import('netrc-parser')
    const NetrcClass = (NetrcModule as any).Netrc || (NetrcModule as any).default.constructor
    this.netrc = new NetrcClass()
    await this.netrc.load()
    this.userConfig = new deps.UserConfig(this.config)
    await this.userConfig.init()
    telemetryDebug('Herokulytics client initialized (install_id: %s)', this.userConfig.install)
  }
}
