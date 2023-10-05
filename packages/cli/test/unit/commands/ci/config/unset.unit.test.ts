import {expect, test} from '@oclif/test'

const key = 'FOO'
const pipeline =  {
  id: '123e4567-e89b-12d3-a456-426655440000',
  name: 'test-pipeline',
}
describe('heroku ci:config:unset', function () {
  test
    .stderr()
    .nock('https://api.heroku.com', api => {
      api.get(`/pipelines/${pipeline.id}`)
        .reply(200, pipeline)
        .patch(`/pipelines/${pipeline.id}/stage/test/config-vars`)
        .reply(200, {[key]: null})
    })
    .command(['ci:config:unset', `--pipeline=${pipeline.id}`, key])
    .it('displays the config value key being unset', ({stderr}) => {
      expect(stderr).to.contain('Unsetting FOO... done')
    })

  test
    .stderr()
    .command(['ci:config:unset', `--pipeline=${pipeline.id}`])
    .catch(error => {
      expect(error.message).to.equal('Usage: heroku ci:config:unset KEY1 [KEY2 ...]\nMust specify KEY to unset.')
    })
    .it('errors with example of valid args')
})
