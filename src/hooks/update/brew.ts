import {Hook} from '@cli-engine/engine'
import {spawnSync, SpawnSyncOptions} from 'child_process'
import cli from 'cli-ux'
import * as path from 'path'

import * as fs from '../../file'

const debug = require('debug')('heroku:completions')

function brew(args: string[], opts: SpawnSyncOptions = {}) {
  debug('brew %o', args)
  return spawnSync('brew', args, {stdio: 'inherit', ...opts, encoding: 'utf8'})
}

interface InstallReceipt {
  source: {
    tap: string
  }
}

export default class BrewMigrateHook extends Hook<'update'> {
  async run() {
    try {
      if (this.config.platform !== 'darwin') return

      if (!await this.needsMigrate()) return

      debug('migrating from brew')
      // not on private tap, move to it
      cli.action.start('Upgrading homebrew formula')
      brew(['tap', 'heroku/brew'])
      brew(['upgrade', 'heroku/brew/heroku'])
      cli.action.stop()
    } catch (err) {
      debug(err)
    }
  }

  private get brewRoot() {
    return path.join(process.env.HOMEBREW_PREFIX || '/usr/local')
  }

  private get binPath(): string | undefined {
    try {
      return fs.realpathSync(path.join(this.brewRoot, 'bin/heroku'))
    } catch (err) {
      if (err.code === 'ENOENT') return
      throw err
    }
  }

  private get cellarPath(): string | undefined {
    if (!this.binPath) return
    if (!this.binPath.startsWith(path.join(this.brewRoot, 'Cellar'))) return
    let p = path.resolve(
      this.binPath,
      path.dirname(path.relative(this.binPath, path.join(this.brewRoot, 'Cellar/heroku'))),
    )
    return p
  }

  private async fetchInstallReceipt(): Promise<InstallReceipt | undefined> {
    if (!this.cellarPath) return
    return fs.readJSON(path.join(this.cellarPath, 'INSTALL_RECEIPT.json'))
  }

  private async needsMigrate(): Promise<boolean> {
    let receipt = await this.fetchInstallReceipt()
    if (!receipt) return false
    return receipt.source.tap === 'homebrew/core'
  }
}
