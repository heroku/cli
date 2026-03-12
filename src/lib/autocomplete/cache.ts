import {stat} from 'node:fs/promises'
import fs from 'fs-extra'

export async function updateCache(cachePath: string, cache: any) {
  await fs.ensureFile(cachePath)
  await fs.writeJSON(cachePath, cache)
}

async function _mtime(f: string): Promise<Date> {
  const statResult = await stat(f)
  return statResult.mtime
}

async function _isStale(cachePath: string, cacheDuration: number): Promise<boolean> {
  const past = new Date()
  past.setSeconds(past.getSeconds() - cacheDuration)
  const mtime = await _mtime(cachePath)
  return past.getTime() > mtime.getTime()
}

export async function fetchCache(cachePath: string, cacheDuration: number, options: any): Promise<Array<string>> {
  const cachePresent = await fs.pathExists(cachePath)
  if (cachePresent && !(await _isStale(cachePath, cacheDuration))) {
    return fs.readJSON(cachePath)
  }

  const cache = await options.cacheFn()
  // to-do: move this to a fork
  await updateCache(cachePath, cache)
  return cache
}
