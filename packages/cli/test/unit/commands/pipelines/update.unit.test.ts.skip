import {expect, test} from '@oclif/test'

describe('pipelines:update', function () {
  const app = 'example'
  const id = '0123'
  const stage = 'production'

  const coupling = {id, stage}

  test
    .stderr()
    .nock('https://api.heroku.com', api => {
      api
        .get(`/apps/${app}/pipeline-couplings`)
        .reply(200, coupling)
        .patch(`/pipeline-couplings/${id}`)
        .reply(200, coupling)
    })
    .command(['pipelines:update', `--app=${app}`, `--stage=${stage}`])
    .it('displays the right messages', ctx => {
      expect(ctx.stderr).to.include(`Changing ⬢ ${app} to ${stage}... done`)
    })
})
