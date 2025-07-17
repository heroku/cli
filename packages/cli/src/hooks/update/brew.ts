import {Hook} from '@oclif/core'
import {spawnSync, SpawnSyncOptions} from 'child_process'
import * as path from 'path'
import debug from 'debug'

import * as fs from '../../file.js'

const debugLog = debug('heroku:brewhook')

function brew(args: string[], opts: SpawnSyncOptions = {}) {
  debugLog('brew %o', args)
  return spawnSync('brew', args, {stdio: 'inherit', ...opts, encoding: 'utf8'})
}

interface InstallReceipt {
  source: {
    tap: string;
  };
}

const brewHook: Hook<'update'> = async function () {
  if (this.config.platform !== 'darwin') return

  const brewRoot = path.join(process.env.HOMEBREW_PREFIX || '/usr/local')
  let binPath
  try {
    binPath = fs.realpathSync(path.join(brewRoot, 'bin/heroku'))
  } catch (error: any) {
    if (error.code === 'ENOENT') return
    throw error
  }

  let cellarPath: string
  if (binPath && binPath.startsWith(path.join(brewRoot, 'Cellar'))) {
    cellarPath = path.resolve(binPath, path.dirname(path.relative(binPath, path.join(brewRoot, 'Cellar/heroku'))))
  }

  const fetchInstallReceipt = async (): Promise<InstallReceipt | undefined> => {
    if (!cellarPath) return
    return fs.readJSON(path.join(cellarPath, 'INSTALL_RECEIPT.json'))
  }

  const needsMigrate = async (): Promise<boolean> => {
    const receipt = await fetchInstallReceipt()
    if (!receipt) return false
    return receipt.source.tap === 'homebrew/core'
  }

  if (!await needsMigrate()) return

  debugLog('migrating from brew')
  // not on private tap, move to it
  brew(['uninstall', 'heroku'])
  brew(['install', 'heroku/brew/heroku'])
}

export default brewHook
