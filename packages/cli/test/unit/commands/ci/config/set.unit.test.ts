import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

const key = 'FOO'
const value = 'bar'
const pipeline = {
  id: '123e4567-e89b-12d3-a456-426655440000',
  name: 'test-pipeline',
}

describe('heroku ci:config:set', function () {
  afterEach(() => nock.cleanAll())

  it('sets new config', async () => {
    nock('https://api.heroku.com')
      .get(`/pipelines/${pipeline.id}`)
      .reply(200, pipeline)
      .patch(`/pipelines/${pipeline.id}/stage/test/config-vars`)
      .reply(200, {[key]: value})

    const {stdout} = await runCommand(['ci:config:set', `--pipeline=${pipeline.id}`, '--', `${key}=${value}`])

    expect(stdout).to.include(key)
    expect(stdout).to.include(value)
  })

  it('errors with example of valid args', async () => {
    const {error} = await runCommand(['ci:config:set', `--pipeline=${pipeline.id}`])
    expect(error?.message).to.equal('Usage: heroku ci:config:set KEY1 [KEY2 ...]\nMust specify KEY to set.')
  })

  it('errors with explanation of required flags', async () => {
    const {error} = await runCommand(['ci:config:set', '--', `${key}=${value}`])
    expect(error?.message).to.include('Exactly one of the following must be provided: --app, --pipeline')
  })
})
