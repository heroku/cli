import {Interfaces} from '@oclif/core'
import {randomUUID} from 'node:crypto'
import * as path from 'path'

import deps from './deps'

export interface ConfigJSON {
  schema: 1;
  install?: string;
  skipAnalytics?: boolean;
}

export default class UserConfig {
  private needsSave = false

  private body!: ConfigJSON

  private mtime?: number

  private saving?: Promise<void>

  private _init!: Promise<void>

  // eslint-disable-next-line no-useless-constructor
  constructor(private readonly config: Interfaces.Config) {}

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
      this.debug('init')
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

  private get debug() {
    return require('debug')('heroku:user_config')
  }

  private get file() {
    return path.join(this.config.dataDir, 'config.json')
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
      const body = await deps.file.readJSON(this.file)
      return body
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error
      this.debug('not found')
    }
  }

  private async migrate() {
    if (await deps.file.exists(this.file)) return
    const old = path.join(this.config.configDir, 'config.json')
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
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error
    }
  }

  private genInstall() {
    this.install = randomUUID()
    return this.install
  }
}
