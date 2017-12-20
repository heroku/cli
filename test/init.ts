import * as nock from 'nock'
import * as path from 'path'
import { cli } from 'cli-ux'

process.setMaxListeners(0)

let g: any = global
g.columns = 80
g.testing = true

beforeEach(() => {
  cli.config.mock = true
})
