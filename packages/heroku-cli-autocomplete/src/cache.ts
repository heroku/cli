// TODO: move to its own package

import * as fs from 'fs-extra'
import * as moment from 'moment'

interface Options {
  cacheFn: () => Promise<Array<string>>
}

export default class {
  static async fetch(cachePath: string, cacheDuration: number, options: Options): Promise<Array<string>> {
    let cachePresent = fs.existsSync(cachePath)
    if (cachePresent && !this.isStale(cachePath, cacheDuration)) {
      return fs.readJSON(cachePath)
    }
    const cache = await options.cacheFn()
    // TODO: move this to a fork
    await this.updateCache(cachePath, cache)
    return cache
  }

  private static async updateCache(cachePath: string, cache: any) {
    await fs.ensureFile(cachePath)
    await fs.writeJSON(cachePath, cache)
  }

  private static isStale(cachePath: string, cacheDuration: number): boolean {
    return this.mtime(cachePath).isBefore(moment().subtract(cacheDuration, 'seconds'))
  }

  private static mtime(f: any) {
    return moment(fs.statSync(f).mtime)
  }
}
