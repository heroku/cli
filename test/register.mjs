import {register} from 'node:module'
import path from 'node:path'
import {fileURLToPath, pathToFileURL} from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Set TS_NODE_PROJECT so ts-node uses test/tsconfig.json
process.env.TS_NODE_PROJECT = path.join(__dirname, 'tsconfig.json')

register('ts-node/esm', pathToFileURL('./'))
