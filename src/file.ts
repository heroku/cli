import * as FS from 'fs-extra'
import * as path from 'path'

import deps from './deps'

const debug = require('debug')('heroku-cli:file')

export function exists(f: string): Promise<boolean> {
  // debug('exists', f)
  // @ts-ignore
  return deps.fs.exists(f)
}

export async function stat(file: string): Promise<FS.Stats> {
  // debug('stat', file)
  return deps.fs.stat(file)
}

export async function rename(from: string, to: string) {
  debug('rename', from, to)
  return deps.fs.rename(from, to)
}

export async function remove(file: string) {
  if (!await exists(file)) return
  debug('remove', file)
  return deps.fs.remove(file)
}

export async function ls(dir: string): Promise<{ path: string; stat: FS.Stats }[]> {
  let files = await deps.fs.readdir(dir)
  let paths = files.map(f => path.join(dir, f))
  return Promise.all(paths.map(path => deps.fs.stat(path).then(stat => ({ path, stat }))))
}

export async function removeEmptyDirs(dir: string): Promise<void> {
  let files
  try {
    files = await ls(dir)
  } catch (err) {
    if (err.code === 'ENOENT') return
    throw err
  }
  let dirs = files.filter(f => f.stat.isDirectory()).map(f => f.path)
  for (let p of dirs.map(removeEmptyDirs)) await p
  files = await ls(dir)
  if (!files.length) await remove(dir)
}

export async function readJSON(file: string) {
  debug('readJSON', file)
  return deps.fs.readJSON(file)
}

export async function outputJSON(file: string, data: any, options: FS.WriteOptions = {}) {
  debug('outputJSON', file)
  return deps.fs.outputJSON(file, data, { spaces: 2, ...options })
}

export function realpathSync(p: string) {
  return deps.fs.realpathSync(p)
}
