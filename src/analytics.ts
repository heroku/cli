import {vars} from '@heroku-cli/command'
import {Command, Interfaces} from '@oclif/core'
import debug from 'debug'
import fs from 'fs-extra'
import * as path from 'path'

import deps from './deps.js'

const analyticsDebug = debug('heroku:analytics')
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

export default class AnalyticsCommand {
  config: Interfaces.Config

  http: typeof deps.HTTP

  initialize: Promise<void>

  userConfig!: typeof deps.UserConfig.prototype

  private netrc: any

  constructor(config: Interfaces.Config) {
    this.config = config
    this.http = deps.HTTP.create({
      headers: {'user-agent': config.userAgent},
    })
    this.initialize = this.init()
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

    // Batch file existence checks for better performance
    const [cmdExists, flagExists, valueExists, rootExists] = await Promise.all([
      fs.pathExists(path.join(root, 'command')),
      fs.pathExists(path.join(root, 'flag')),
      fs.pathExists(path.join(root, 'value')),
      fs.pathExists(root),
    ])

    let score = 0
    if (cmdExists) score += 1
    if (flagExists) score += 2
    if (valueExists) score += 4
    if (rootExists) await fs.remove(root)
    return score
  }

  async record(opts: RecordOpts) {
    await this.initialize
    const mcpMode = process.env.HEROKU_MCP_MODE === 'true'
    const mcpServerVersion = process.env.HEROKU_MCP_SERVER_VERSION || 'unknown'
    const {id, plugin} = opts.Command
    if (!plugin) {
      analyticsDebug('no plugin found for analytics')
      return
    }

    if (this.userConfig.skipAnalytics) return

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

    const data = Buffer.from(JSON.stringify(analyticsData)).toString('base64')
    if (this.authorizationToken) {
      return this.http.get(`${this.url}?data=${data}`, {headers: {authorization: `Bearer ${this.authorizationToken}`}}).catch(error => analyticsDebug(error))
    }

    return this.http.get(`${this.url}?data=${data}`).catch(error => analyticsDebug(error))
  }

  private async init() {
    const NetrcModule = await import('netrc-parser')
    const NetrcClass = (NetrcModule as any).Netrc || (NetrcModule as any).default.constructor
    this.netrc = new NetrcClass()
    await this.netrc.load()
    this.userConfig = new deps.UserConfig(this.config)
    await this.userConfig.init()
  }
}
