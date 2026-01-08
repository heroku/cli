import {expect} from 'chai'
import {runCommand} from '@oclif/test'
import nock from 'nock'

describe('pipelines:destroy', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('displays the right messages', async function () {
    const pipeline = {name: 'example', id: '0123'}
    nock('https://api.heroku.com')
      .get(`/pipelines?eq[name]=${pipeline.name}`)
      .reply(200, [pipeline])
      .delete(`/pipelines/${pipeline.id}`)
      .reply(200, pipeline)

    const {stderr} = await runCommand(['pipelines:destroy', 'example'])

    expect(stderr).to.include('Destroying example pipeline... done')
  })
})
