import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('pipelines:rename', function () {
  const oldName = 'polaris'
  const newName = 'vega'
  const id = '12345'
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('displays the right messages', async function () {
    api
      .get(`/pipelines?eq[name]=${oldName}`)
      .reply(200, [{id, name: oldName}])
      .patch(`/pipelines/${id}`)
      .reply(200, {id, name: newName})

    const {stderr} = await runCommand(['pipelines:rename', oldName, newName])

    expect(stderr).to.include(`Renaming ${oldName} pipeline to ${newName}... done`)
  })
})
