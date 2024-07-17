import {Config} from '@oclif/core'
import {expect, test} from '@oclif/test'
import * as path from 'path'

import webhooksAbstractClass from '../../../../src/lib/webhooks/base'

class Webhooks extends webhooksAbstractClass {
  // eslint-disable-next-line no-useless-constructor
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
  test
    .stdout()
    .do(function () {
      const webhookInfo = webhookObject.webhookType({pipeline: 'randomPipeline', app: ''})
      expect(webhookInfo).to.deep.equal({path: '/pipelines/randomPipeline', display: 'randomPipeline'})
    })
    .it('returns correct pipeline path and display info')

  test
    .stdout()
    .do(function () {
      const webhookInfo = webhookObject.webhookType({pipeline: '', app: 'randomApp'})
      // `display` below contains ANSI escape codes for color due to us not reading from stdout. using `contains` instead of `equal`
      expect(webhookInfo.display).to.contain('randomApp')
      expect(webhookInfo.path).to.equal('/apps/randomApp')
    })
    .it('returns correct app path and display info')

  test
    .stdout()
    .do(function () {
      webhookObject.webhookType({pipeline: '', app: ''})
    })
    .catch(error => expect(error.message).to.equal('No app specified'))
    .it('returns error if no arguments are given')
})
