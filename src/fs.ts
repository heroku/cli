import * as fs from 'fs-extra'
import * as path from 'path'

export async function ls(dir: string): Promise<{ path: string; stat: fs.Stats }[]> {
  let files = await fs.readdir(dir)
  let paths = files.map(f => path.join(dir, f))
  return Promise.all(paths.map(path => fs.stat(path).then(stat => ({path, stat}))))
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
  if (!files.length) await fs.remove(dir)
}

export * from 'fs-extra'
