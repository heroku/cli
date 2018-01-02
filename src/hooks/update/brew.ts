import { Hook } from '@cli-engine/engine'
import { spawnSync, SpawnSyncOptions } from 'child_process'
import cli from 'cli-ux'
import * as path from 'path'

import * as fs from '../../file'

const debug = require('debug')('heroku:completions')

function brew(args: string[], opts: SpawnSyncOptions = {}) {
  debug('brew %o', args)
  return spawnSync('brew', args, { stdio: 'inherit', ...opts, encoding: 'utf8' })
}

export default class BrewMigrateHook extends Hook<'update'> {
  async run() {
    try {
      if (this.config.platform !== 'darwin') return
      const brewRoot = path.join(process.env.HOMEBREW_PREFIX || '/usr/local')
      let p = fs.realpathSync(path.join(brewRoot, 'bin/heroku'))

      if (!p.startsWith(path.join(brewRoot, 'Cellar'))) return
      if (this.taps().includes('homebrew/brew')) return

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

  taps(): string[] {
    const { stdout } = brew(['tap'], { stdio: [0, 'pipe', 2] })
    return stdout.split('\n')
  }
}
