import {expect, test} from '@oclif/test'

const key = 'FOO'
const value = 'bar'
const pipeline =  {
  id: '123e4567-e89b-12d3-a456-426655440000',
  name: 'test-pipeline',
}
describe('heroku ci:config:get', function () {
  test
    .stdout()
    .nock('https://api.heroku.com', api => {
      api.get(`/pipelines/${pipeline.id}`)
        .reply(200, pipeline)
        .get(`/pipelines/${pipeline.id}/stage/test/config-vars`)
        .reply(200, {[key]: value})
    })
    .command(['ci:config:get', `--pipeline=${pipeline.id}`, key])
    .it('displays the config value', ({stdout}) => {
      expect(stdout).to.equal(`${value}\n`)
    })

  test
    .stdout()
    .nock('https://api.heroku.com', api => {
      api.get(`/pipelines/${pipeline.id}`)
        .reply(200, pipeline)
        .get(`/pipelines/${pipeline.id}/stage/test/config-vars`)
        .reply(200, {[key]: value})
    })
    .command(['ci:config:get', `--pipeline=${pipeline.id}`, '--shell',  key])
    .it('displays config formatted for shell', ({stdout}) => {
      expect(stdout).to.equal(`${key}=${value}\n`)
    })
})
