import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {stdout} from './script-exec.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default async function getVersion() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8'))
  let {version} = packageJson
  if (version.includes('-')) {
    const channel = version.split('-')[1].split('.')[0]
    const sha = await stdout('git', ['rev-parse', '--short', 'HEAD'])
    version = `${version.split('-')[0]}-${channel}.${sha}`
  }

  return version
}
