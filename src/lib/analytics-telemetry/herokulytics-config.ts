/* eslint-disable  @typescript-eslint/no-unused-expressions */
import {Interfaces} from '@oclif/core'
import debug from 'debug'
import fs from 'fs-extra'
import {randomUUID} from 'node:crypto'
import {stat} from 'node:fs/promises'
import path from 'node:path'

const herokulyticsConfigDebug = debug('heroku:analytics:herokulytics-config')
herokulyticsConfigDebug.color = '147'

export interface ConfigJSON {
  install?: string;
  schema: 1;
  skipAnalytics?: boolean;
}

export default class HerokulyticsConfig {
  private _init!: Promise<void>
  private body!: ConfigJSON
  private mtime?: number
  private needsSave = false
  private saving?: Promise<void>

  constructor(private readonly config: Interfaces.Config) {}

  private get file() {
    return path.join(this.config.dataDir, 'config.json')
  }

  public get install() {
    return this.body.install || this.genInstall()
  }

  public set install(install: string) {
    this.body.install = install
    this.needsSave = true
  }

  public get skipAnalytics() {
    if (this.config.scopedEnvVar('SKIP_ANALYTICS') === '1') return true
    if (typeof this.body.skipAnalytics !== 'boolean') {
      this.body.skipAnalytics = false
      this.needsSave = true
    }

    return this.body.skipAnalytics
  }

  public async init() {
    await this.saving
    if (this._init) return this._init

    this._init = (async () => {
      herokulyticsConfigDebug('init')
      this.body = (await this.read()) || {schema: 1}

      if (!this.body.schema) {
        this.body.schema = 1
        this.needsSave = true
      } else if (this.body.schema !== 1) this.body = {schema: 1}
      // tslint:disable-next-line
      this.install
      // tslint:disable-next-line
      this.skipAnalytics

      if (this.needsSave) await this.save()
    })()

    return this._init
  }

  private async canWrite() {
    if (!this.mtime) return true
    return (await this.getLastUpdated()) === this.mtime
  }

  private genInstall() {
    this.install = randomUUID()
    return this.install
  }

  private async getLastUpdated(): Promise<number | undefined> {
    try {
      const statResult = await stat(this.file)
      return statResult.mtime.getTime()
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error
    }
  }

  private async migrate() {
    if (await fs.pathExists(this.file)) return
    const old = path.join(this.config.configDir, 'config.json')
    if (!await fs.pathExists(old)) return
    herokulyticsConfigDebug('moving config into new place')
    await fs.rename(old, this.file)
  }

  private async read(): Promise<ConfigJSON | undefined> {
    await this.migrate()
    try {
      this.mtime = await this.getLastUpdated()
      const body = await fs.readJSON(this.file)
      return body
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error
      herokulyticsConfigDebug('not found')
    }
  }

  private async save(): Promise<void> {
    if (!this.needsSave) return
    this.needsSave = false
    this.saving = (async () => {
      herokulyticsConfigDebug('saving')
      if (!await this.canWrite()) {
        throw new Error('file modified, cannot save')
      }

      await fs.outputJSON(this.file, this.body, {spaces: 2})
    })()
  }
}
