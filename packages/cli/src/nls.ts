import {readFileSync} from 'fs'
import {fileURLToPath} from 'url'
import {dirname, join} from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
// package.nls.json is in src directory, need to reference it from lib or src
// When compiled, __dirname will be in lib/, so we need to go up to packages/cli and then into src
// When in source, __dirname will be in src/
const srcDir = __dirname.endsWith('/lib') || __dirname.endsWith('/lib/') ? join(__dirname, '../src') : __dirname
const nlsPath = join(srcDir, 'package.nls.json')
const nlsValues: Record<string, string> = JSON.parse(readFileSync(nlsPath, 'utf8'))

/**
 * Non-localized strings util.
 *
 * @param key The key of the non-localized string to retrieve.
 * @return string
 */
export function nls(key: string): string {
  return nlsValues[key] || key
}
