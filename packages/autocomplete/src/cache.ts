import * as fs from 'fs-extra'

export async function updateCache(cachePath: string, cache: any) {
  await fs.ensureFile(cachePath)
  await fs.writeJSON(cachePath, cache)
}

function _isStale(cachePath: string, cacheDuration: number): boolean {
  const past = new Date()
  past.setSeconds(past.getSeconds() - cacheDuration)
  return past.getTime() > _mtime(cachePath).getTime()
}

function _mtime(f: any): Date {
  return fs.statSync(f).mtime
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
