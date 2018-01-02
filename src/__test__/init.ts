import * as nock from 'nock'
import { cli } from 'cli-ux'

process.setMaxListeners(0)

let g: any = global
g.columns = 80
g.testing = true

nock.disableNetConnect()

cli.config.mock = true
