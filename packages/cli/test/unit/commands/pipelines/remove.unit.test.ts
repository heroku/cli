import {expect, test} from '@oclif/test'

describe('pipelines:remove', function () {
  const app = 'example'
  const id = '0123'

  const coupling = {id, stage: 'production'}

  test
    .stderr()
    .nock('https://api.heroku.com', api => {
      api
        .get(`/apps/${app}/pipeline-couplings`)
        .reply(200, coupling)
        .delete(`/pipeline-couplings/${id}`)
        .reply(200, coupling)
    })
    .command(['pipelines:remove', '--app=example'])
    .retries(3)
    .it('displays the right messages', ctx => {
      expect(ctx.stderr).to.contain(`Removing ⬢ ${app}... done\n`)
    })
})
