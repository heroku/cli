import path from 'node:path'
import * as fs from 'node:fs'
import {fileURLToPath} from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const packageJsonPath = path.resolve(__dirname, '../../../package.json')
const pjson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
const { oclif } = pjson

export function getAllVersionFlags() {
  return [...oclif.additionalVersionFlags, '--version']
}

export function getAllHelpFlags() {
  return [...oclif.additionalHelpFlags, '--help', 'help']
}
