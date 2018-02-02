import * as fs from 'fs-extra'
import * as path from 'path'

export interface File {
  type: 'file'
  content?: string | object
  mtime?: Date
}

export interface Symlink {
  type: 'symlink'
  to: string
  mtime?: Date
}

export function withFiles(files: { [k: string]: File | Symlink | string }, options: { root?: string } = {}) {
  const root = options.root || ''
  const promises = Object.keys(files).map(async p => {
    const filePath = path.join(root, p)
    await fs.mkdirp(path.dirname(filePath))
    const file: File | Symlink =
      typeof files[p] === 'string' ? ({type: 'file', content: files[p]} as File) : (files[p] as File | Symlink)
    switch (file.type) {
      case 'file':
        let s = typeof file.content === 'object' ? JSON.stringify(file.content) : file.content || ''
        await fs.outputFile(filePath, s)
        break
      case 'symlink':
        // @ts-ignore
        if (!await fs.exists(file.to)) await fs.outputFile(file.to, '')
        await fs.symlink(file.to, filePath)
        break
    }
    if (file.mtime) fs.utimesSync(filePath, new Date(), file.mtime)
  })
  return Promise.all(promises)
}
