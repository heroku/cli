import {expect, test} from '@oclif/test'

const key = 'FOO'
const value = 'bar'
const pipeline = {
  id: '123e4567-e89b-12d3-a456-426655440000',
  name: 'test-pipeline',
}

describe('heroku ci:config:set', function () {
  test
    .stdout()
    .nock('https://api.heroku.com', api => {
      api.get(`/pipelines/${pipeline.id}`)
        .reply(200, pipeline)
        .patch(`/pipelines/${pipeline.id}/stage/test/config-vars`)
        .reply(200, {[key]: value})
    })
    .command(['ci:config:set', `--pipeline=${pipeline.id}`, '--', `${key}=${value}`])
    .it('sets new config', ({stdout}) => {
      expect(stdout).to.include(key)
      expect(stdout).to.include(value)
    })
})
