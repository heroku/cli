import qq from 'qqjs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default async () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf-8'))
  let { version } = packageJson
  if (version.includes('-')) {
    let channel = version.split('-')[1].split('.')[0]
    let sha = await qq.x.stdout('git', ['rev-parse', '--short', 'HEAD'])
    version = `${version.split('-')[0]}-${channel}.${sha}`
  }
  return version
}
