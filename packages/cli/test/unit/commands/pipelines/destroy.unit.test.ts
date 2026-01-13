import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('pipelines:destroy', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('displays the right messages', async function () {
    const pipeline = {id: '0123', name: 'example'}

    api
      .get(`/pipelines?eq[name]=${pipeline.name}`)
      .reply(200, [pipeline])
      .delete(`/pipelines/${pipeline.id}`)
      .reply(200, pipeline)

    const {stderr} = await runCommand(['pipelines:destroy', 'example'])

    expect(stderr).to.include('Destroying example pipeline... done')
  })
})
