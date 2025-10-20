import path from 'node:path'
import * as fs from 'node:fs'
import {fileURLToPath} from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load oclif configuration from .oclifrc.cjs
const oclifrcPath = path.resolve(__dirname, '../../../.oclifrc.cjs')
const oclifConfig = require(oclifrcPath)

export function getAllVersionFlags() {
  return [...oclifConfig.additionalVersionFlags, '--version']
}

export function getAllHelpFlags() {
  return [...oclifConfig.additionalHelpFlags, '--help', 'help']
}
