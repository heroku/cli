import * as fs from 'fs-extra'

export interface File {
  content?: string
  mtime?: Date
}

export function withFiles(files: { [k: string]: File | string }) {
  for (let p of Object.keys(files)) {
    let file = typeof files[p] === 'string' ? ({ content: files[p] } as File) : (files[p] as File)
    fs.outputFileSync(p, file.content || '')
    if (file.mtime) fs.utimesSync(p, new Date(), file.mtime)
  }
}
