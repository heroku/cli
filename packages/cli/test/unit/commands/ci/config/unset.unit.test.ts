import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

const key = 'FOO'
const pipeline =  {
  id: '123e4567-e89b-12d3-a456-426655440000',
  name: 'test-pipeline',
}

describe('heroku ci:config:unset', function () {
  afterEach(() => nock.cleanAll())

  it('displays the config value key being unset', async () => {
    nock('https://api.heroku.com')
      .get(`/pipelines/${pipeline.id}`)
      .reply(200, pipeline)
      .patch(`/pipelines/${pipeline.id}/stage/test/config-vars`)
      .reply(200, {[key]: null})

    const {stderr} = await runCommand(['ci:config:unset', `--pipeline=${pipeline.id}`, key])

    expect(stderr).to.contain('Unsetting FOO... done')
  })

  it('errors with example of valid args', async () => {
    const {error} = await runCommand(['ci:config:unset', `--pipeline=${pipeline.id}`])
    expect(error?.message).to.equal('Usage: heroku ci:config:unset KEY1 [KEY2 ...]\nMust specify KEY to unset.')
  })
})
