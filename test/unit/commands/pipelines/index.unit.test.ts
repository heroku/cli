import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import Pipelines from '../../../../src/commands/pipelines/index.js'

describe('pipelines', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('shows a list of pipelines', async function () {
    api
      .get('/pipelines')
      .reply(200, [
        {id: '0123', name: 'Betelgeuse'},
        {id: '9876', name: 'Sirius'},
      ])

    const {stderr, stdout} = await runCommand(Pipelines, [])

    expect(stderr).to.contain('')
    expect(stdout).to.contain('My Pipelines')
    expect(stdout).to.contain('Betelgeuse')
    expect(stdout).to.contain('Sirius')
  })

  it('shows a list of pipelines, json formatted', async function () {
    api
      .get('/pipelines')
      .reply(200, [
        {id: '0123', name: 'Betelgeuse'},
        {id: '9876', name: 'Sirius'},
      ])

    const {stderr, stdout} = await runCommand(Pipelines, ['--json'])

    expect(stderr).to.contain('')
    expect(JSON.parse(stdout)).to.eql([
      {id: '0123', name: 'Betelgeuse'},
      {id: '9876', name: 'Sirius'},
    ])
  })
})
