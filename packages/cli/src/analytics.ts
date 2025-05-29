import {vars} from '@heroku-cli/command'
import {Command, Interfaces} from '@oclif/core'
import * as path from 'path'
import deps from './deps.js'
import debug from 'debug'

const analyticsDebug = debug('heroku:analytics')
export interface RecordOpts {
  Command: Command.Class;
  argv: string[];
}

export interface AnalyticsInterface {
  source: string;
  event: string;
  properties: {
    cli: string;
    command: string;
    completion: number;
    version: string;
    plugin: string;
    plugin_version: string;
    os: string;
    shell: string;
    valid: boolean;
    language: string;
    install_id: string;
  };
}

export default class AnalyticsCommand {
  config: Interfaces.Config

  userConfig!: typeof deps.UserConfig.prototype

  http: typeof deps.HTTP

  initialize: Promise<void>;

  private netrc: any;

  constructor(config: Interfaces.Config) {
    this.config = config
    this.http = deps.HTTP.create({
      headers: {'user-agent': config.userAgent},
    })
    this.initialize = this.init()
  }

  async record(opts: RecordOpts) {
    await this.initialize
    const plugin = opts.Command.plugin
    if (!plugin) {
      analyticsDebug('no plugin found for analytics')
      return
    }

    if (this.userConfig.skipAnalytics) return

    const analyticsData: AnalyticsInterface = {
      source: 'cli',
      event: opts.Command.id,
      properties: {
        cli: this.config.name,
        command: opts.Command.id,
        completion: await this._acAnalytics(opts.Command.id),
        version: this.config.version,
        plugin: plugin.name,
        plugin_version: plugin.version,
        os: this.config.platform,
        shell: this.config.shell,
        valid: true,
        language: 'node',
        install_id: this.userConfig.install,
      },
    }

    const data = Buffer.from(JSON.stringify(analyticsData)).toString('base64')
    if (this.authorizationToken) {
      return this.http.get(`${this.url}?data=${data}`, {headers: {authorization: `Bearer ${this.authorizationToken}`}}).catch(error => analyticsDebug(error))
    }

    return this.http.get(`${this.url}?data=${data}`).catch(error => analyticsDebug(error))
  }

  get url(): string {
    return process.env.HEROKU_ANALYTICS_URL || 'https://backboard.heroku.com/hamurai'
  }

  get authorizationToken(): string | undefined {
    return process.env.HEROKU_API_KEY || this.netrcToken
  }

  get netrcToken(): string | undefined {
    return this.netrc?.machines[vars.apiHost]?.password
  }

  get usingHerokuAPIKey(): boolean {
    const k = process.env.HEROKU_API_KEY
    return Boolean(k && k.length > 0)
  }

  get netrcLogin(): string | undefined {
    return this.netrc?.machines[vars.apiHost]?.login
  }

  get user(): string | undefined {
    if (this.usingHerokuAPIKey) return
    return this.netrcLogin
  }

  async _acAnalytics(id: string): Promise<number> {
    if (id === 'autocomplete:options') return 0
    const root = path.join(this.config.cacheDir, 'autocomplete', 'completion_analytics')
    const meta = {
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

  private async init() {
    const NetrcModule = await import('netrc-parser')
    const NetrcClass = (NetrcModule as any).Netrc || (NetrcModule as any).default.constructor
    this.netrc = new NetrcClass()
    await this.netrc.load()
    this.userConfig = new deps.UserConfig(this.config)
    await this.userConfig.init()
  }
}
