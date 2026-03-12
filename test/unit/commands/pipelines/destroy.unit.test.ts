import {expect} from 'chai'
import nock from 'nock'

import PipelinesDestroy from '../../../../src/commands/pipelines/destroy.js'
import {runCommand} from '../../../helpers/run-command.js'

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

    const {stderr} = await runCommand(PipelinesDestroy, ['example'])

    expect(stderr).to.include('Destroying example pipeline... done')
  })
})
