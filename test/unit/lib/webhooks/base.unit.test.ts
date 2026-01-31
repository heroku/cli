import {Config} from '@oclif/core'
import {expect} from 'chai'
import * as path from 'path'
import {fileURLToPath} from 'url'

import webhooksAbstractClass from '../../../../src/lib/webhooks/base.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class Webhooks extends webhooksAbstractClass {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(argv: string[], config: Config) {
    super(argv, config)
  }

  async run() {
    'empty run function'
  }
}
const root = path.resolve(__dirname, '../../package.json')
const config = new Config({root})
const webhookObject = new Webhooks([], config)

describe('webhooks type', function () {
  it('returns correct pipeline path and display info', function () {
    const webhookInfo = webhookObject.webhookType({app: '', pipeline: 'randomPipeline'})
    expect(webhookInfo).to.deep.equal({display: 'randomPipeline', path: '/pipelines/randomPipeline'})
  })

  it('returns correct app path and display info', function () {
    const webhookInfo = webhookObject.webhookType({app: 'randomApp', pipeline: ''})
    // `display` below contains ANSI escape codes for color due to us not reading from stdout. using `contains` instead of `equal`
    expect(webhookInfo.display).to.contain('randomApp')
    expect(webhookInfo.path).to.equal('/apps/randomApp')
  })

  it('returns error if no arguments are given', function () {
    expect(() => webhookObject.webhookType({app: '', pipeline: ''})).to.throw('No app specified')
  })
})
