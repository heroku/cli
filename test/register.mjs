import {register} from 'node:module'
import {pathToFileURL} from 'node:url'
import {fileURLToPath} from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Set TS_NODE_PROJECT so ts-node uses test/tsconfig.json
process.env.TS_NODE_PROJECT = path.join(__dirname, 'tsconfig.json')

register('ts-node/esm', pathToFileURL('./'))
