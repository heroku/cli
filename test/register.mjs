import {settings} from '@oclif/core'
import {register} from 'node:module'
import path from 'node:path'
import {fileURLToPath, pathToFileURL} from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Set TS_NODE_PROJECT so ts-node uses test/tsconfig.json
process.env.TS_NODE_PROJECT = path.join(__dirname, 'tsconfig.json')

// Tests register their own loader; Oclif must not rewrite installed plugin JS
// paths to TS source files that are not part of the published package.
settings.enableAutoTranspile = false

register('ts-node/esm', pathToFileURL('./'))
