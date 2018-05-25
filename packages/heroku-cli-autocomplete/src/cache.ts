import * as fs from 'fs-extra'
import * as moment from 'moment'

export async function updateCache(cachePath: string, cache: any) {
  await fs.ensureFile(cachePath)
  await fs.writeJSON(cachePath, cache)
}

function _isStale(cachePath: string, cacheDuration: number): boolean {
  return _mtime(cachePath).isBefore(moment().subtract(cacheDuration, 'seconds'))
}

function _mtime(f: any) {
  return moment(fs.statSync(f).mtime)
}

export async function fetchCache(cachePath: string, cacheDuration: number, options: any): Promise<Array<string>> {
  let cachePresent = fs.existsSync(cachePath)
  if (cachePresent && !_isStale(cachePath, cacheDuration)) {
    return fs.readJSON(cachePath)
  }
  const cache = await options.cacheFn()
  // TODO: move this to a fork
  await updateCache(cachePath, cache)
  return cache
}
