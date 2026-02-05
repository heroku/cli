import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

const key = 'FOO'
const value = 'bar'
const pipeline =  {
  id: '123e4567-e89b-12d3-a456-426655440000',
  name: 'test-pipeline',
}

describe('heroku ci:config:get', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('displays the config value', async function () {
    api
      .get(`/pipelines/${pipeline.id}`)
      .reply(200, pipeline)
      .get(`/pipelines/${pipeline.id}/stage/test/config-vars`)
      .reply(200, {[key]: value})

    const {stdout} = await runCommand(['ci:config:get', `--pipeline=${pipeline.id}`, key])

    expect(stdout).to.equal(`${value}\n`)
  })

  it('displays config formatted for shell', async function () {
    api
      .get(`/pipelines/${pipeline.id}`)
      .reply(200, pipeline)
      .get(`/pipelines/${pipeline.id}/stage/test/config-vars`)
      .reply(200, {[key]: value})

    const {stdout} = await runCommand(['ci:config:get', `--pipeline=${pipeline.id}`, '--shell',  key])

    expect(stdout).to.equal(`${key}=${value}\n`)
  })
})
