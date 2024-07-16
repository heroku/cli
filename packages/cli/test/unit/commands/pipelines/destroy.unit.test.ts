import {expect, test} from '@oclif/test'

describe('pipelines:destroy', function () {
  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com', api => {
      const pipeline = {name: 'example', id: '0123'}
      api.get(`/pipelines?eq[name]=${pipeline.name}`).reply(200, [pipeline])
      return api.delete(`/pipelines/${pipeline.id}`).reply(200, pipeline)
    })
    .command(['pipelines:destroy', 'example'])
    .it('displays the right messages', ctx => {
      expect(ctx.stderr).to.include('Destroying example pipeline... done')
    })
})
