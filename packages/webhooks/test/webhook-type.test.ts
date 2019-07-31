import {expect, test} from '@oclif/test'
import webhookType from '../src/webhook-type'

describe('webhooks type', () => {
  test
    .stdout()
    .do(function () {
      const webhookInfo = webhookType({pipeline: 'randomPipeline', app: ''})
      expect(webhookInfo).to.deep.equal({path: '/pipelines/randomPipeline', display: 'randomPipeline'})
    })
    .it('returns correct pipeline path and display info')

  test
    .stdout()
    .do(function () {
      const webhookInfo = webhookType({pipeline: '', app: 'randomApp'})
      expect(webhookInfo).to.deep.equal({path: '/apps/randomApp', display: '\u001b[38;5;104m⬢ randomApp\u001b[0m'})
    })
    .it('returns correct app path and display info')

  test
    .stdout()
    .do(function () {
      webhookType({pipeline: '', app: ''})
    })
    .catch(e => expect(e.message).to.equal('No app specified'))
    .it('returns error if no arguments are given')
})
