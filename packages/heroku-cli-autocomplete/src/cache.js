// @flow

// TODO: move to its own package

import fs from 'fs-extra'
import moment from 'moment'

type Options = {
  cacheFn: () => Promise<Array<string>>
}

export default class {
  static async fetch (cachePath: string, cacheDuration: number, options: Options): Promise<Array<string>> {
    let cachePresent = await fs.exists(cachePath)
    if (cachePresent && !this._isStale(cachePath, cacheDuration)) {
      return fs.readJSON(cachePath)
    }
    const cache = await options.cacheFn()
    // TODO: move this to a fork
    await this._updateCache(cachePath, cache)
    return cache
  }

  static async _updateCache (cachePath: string, cache: ?any) {
    await fs.ensureFile(cachePath)
    await fs.writeJSON(cachePath, cache)
  }

  static _isStale (cachePath: string, cacheDuration: number): boolean {
    return this._mtime(cachePath).isBefore(moment().subtract(cacheDuration, 'seconds'))
  }

  static _mtime (f) {
    return moment(fs.statSync(f).mtime)
  }
}
