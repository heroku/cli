import deps from './deps'
import * as FS from 'fs-extra'
import * as KLAW from 'klaw'
import * as path from 'path'

const debug = require('debug')('cli:file')

export function exists(f: string): Promise<boolean> {
  // debug('exists', f)
  // @ts-ignore
  return deps.fs.exists(f)
}

export async function stat(file: string) {
  // debug('stat', file)
  return deps.fs.stat(file)
}

export async function rename(from: string, to: string) {
  debug('rename', from, to)
  return deps.fs.rename(from, to)
}

export async function remove(file: string) {
  debug('remove', file)
  return deps.fs.remove(file)
}

export async function ls(dir: string) {
  let files = await deps.fs.readdir(dir)
  let paths = files.map(f => path.join(dir, f))
  return Promise.all(paths.map(path => deps.fs.stat(path).then(stat => ({ path, stat }))))
}

export async function cleanup(dir: string): Promise<void> {
  let files
  try {
    files = await ls(dir)
  } catch (err) {
    if (err.code === 'ENOENT') return
    throw err
  }
  let dirs = files.filter(f => f.stat.isDirectory()).map(f => f.path)
  for (let p of dirs.map(cleanup)) await p
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

export function walk(root: string, opts: KLAW.Options = {}): Promise<KLAW.Item[]> {
  debug('walk', root)
  return new Promise((resolve, reject) => {
    const items: KLAW.Item[] = []
    deps
      .klaw(root, {
        depthLimit: 10000,
        ...opts,
      })
      .on('data', f => items.push(f))
      .on('error', reject)
      .on('end', () => resolve(items))
  })
}
