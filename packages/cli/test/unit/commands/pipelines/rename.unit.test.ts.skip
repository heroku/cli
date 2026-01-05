import {expect, test} from '@oclif/test'

describe('pipelines:rename', function () {
  const oldName = 'polaris'
  const newName = 'vega'
  const id = '12345'

  test
    .stderr()
    .nock('https://api.heroku.com', api => {
      api
        .get(`/pipelines?eq[name]=${oldName}`)
        .reply(200, [{id, name: oldName}])
        .patch(`/pipelines/${id}`)
        .reply(200, {id, name: newName})
    })
    .command(['pipelines:rename', oldName, newName])
    .it('displays the right messages', ctx => {
      expect(ctx.stderr).to.include(`Renaming ${oldName} pipeline to ${newName}... done`)
    })
})
