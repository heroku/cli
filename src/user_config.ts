import * as path from 'path'
import deps from './deps'
import { IConfig } from 'cli-engine-config'

export type ConfigJSON = {
  schema: 1
  install?: string
  skipAnalytics?: boolean
}

export default class UserConfig {
  constructor(private config: IConfig) {}

  public get install() {
    return this.body.install || this.genInstall()
  }
  public set install(install: string) {
    this.body.install = install
    this.needsSave = true
  }
  private genInstall() {
    const uuid = require('uuid/v4')
    this.install = uuid()
    return this.install
  }

  public get skipAnalytics() {
    if (typeof this.body.skipAnalytics !== 'boolean') {
      this.body.skipAnalytics = false
      this.needsSave = true
    }
    return this.body.skipAnalytics
  }

  private _init: Promise<void>
  public async init() {
    await this.saving
    if (this._init) return this._init
    return (this._init = (async () => {
      this.debug('init')
      this.body = (await this.read()) || { schema: 1 }

      if (!this.body.schema) {
        this.body.schema = 1
        this.needsSave = true
      } else if (this.body.schema !== 1) this.body = { schema: 1 }
      this.install
      this.skipAnalytics

      if (this.needsSave) await this.save()
    })())
  }

  private async save(): Promise<void> {
    if (!this.needsSave) return
    this.needsSave = false
    this.saving = (async () => {
      this.debug('saving')
      if (!await this.canWrite()) {
        throw new Error('file modified, cannot save')
      }
      await deps.file.outputJSON(this.file, this.body)
    })()
  }

  private async read(): Promise<ConfigJSON | undefined> {
    await this.migrate()
    try {
      this.mtime = await this.getLastUpdated()
      let body = await deps.file.readJSON(this.file)
      return body
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
      this.debug('not found')
    }
  }

  private async migrate() {
    let old = path.join(this.config.configDir, 'config.json')
    if (old === this.file) return
    if (!await deps.file.exists(old)) return
    this.debug('moving config into new place')
    await deps.file.rename(old, this.file)
  }

  private async canWrite() {
    if (!this.mtime) return true
    return (await this.getLastUpdated()) === this.mtime
  }

  private async getLastUpdated(): Promise<number | undefined> {
    try {
      const stat = await deps.file.stat(this.file)
      return stat.mtime.getTime()
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
    }
  }

  private needsSave: boolean = false
  private body: ConfigJSON
  private mtime?: number
  private saving?: Promise<void>

  private get debug() {
    return require('debug')('heroku:user_config')
  }

  private get file() {
    return path.join(this.config.dataDir, 'config.json')
  }
}
