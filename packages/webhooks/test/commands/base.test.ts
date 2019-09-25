import {Config, IConfig} from '@oclif/config'
import {expect, test} from '@oclif/test'
import * as path from 'path'

import webhooksAbstractClass from '../../src/commands/base'

class Webhooks extends webhooksAbstractClass {
  constructor(argv: string[], config: IConfig) {
    super(argv, config)
  }
  async run() {}
}
const root = path.resolve(__dirname, '../package.json')
const config = new Config({root})
const webhookObject = new Webhooks([], config)

describe('webhooks type', () => {
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
      expect(webhookInfo).to.deep.equal({path: '/apps/randomApp', display: 'randomApp'})
    })
    .it('returns correct app path and display info')

  test
    .stdout()
    .do(function () {
      webhookObject.webhookType({pipeline: '', app: ''})
    })
    .catch(e => expect(e.message).to.equal('No app specified'))
    .it('returns error if no arguments are given')
})
