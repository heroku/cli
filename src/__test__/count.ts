import * as path from 'path'
import { Lockfile } from 'rwlockfile'

import * as fs from 'fs-extra'

interface CountFile {
  count: number
}

const root = path.join(__dirname, '../../tmp/test')
const info = path.join(root, 'count.json')
const lock = new Lockfile(info)

async function read(): Promise<CountFile> {
  try {
    let b = await fs.readJSON(info)
    return b
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
    return { count: 0 }
  }
}

async function write(b: CountFile): Promise<void> {
  await fs.outputJSON(info, b)
}

export default async function inc() {
  await lock.add()
  try {
    const b = await read()
    await write({ count: b.count + 1 })
    return b.count
  } finally {
    await lock.remove()
  }
}
