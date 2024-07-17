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

  test
    .stderr()
    .command(['ci:config:set', `--pipeline=${pipeline.id}`])
    .catch(error => {
      expect(error.message).to.equal('Usage: heroku ci:config:set KEY1 [KEY2 ...]\nMust specify KEY to set.')
    })
    .it('errors with example of valid args')

  test
    .stderr()
    .command(['ci:config:set', '--', `${key}=${value}`])
    .catch(error => {
      expect(error.message).to.include('Exactly one of the following must be provided: --app, --pipeline')
    })
    .it('errors with explanation of required flags')
})
