import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {register} from 'tsx/esm/api'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

register({tsconfig: path.join(__dirname, 'tsconfig.json')})
