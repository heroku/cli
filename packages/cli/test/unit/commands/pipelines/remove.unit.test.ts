import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('pipelines:remove', function () {
  let api: nock.Scope

  const app = 'example'
  const id = '0123'
  const coupling = {id, stage: 'production'}

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('displays the right messages', async function () {
    this.retries(3)

    api
      .get(`/apps/${app}/pipeline-couplings`)
      .reply(200, coupling)
      .delete(`/pipeline-couplings/${id}`)
      .reply(200, coupling)

    const {stderr} = await runCommand(['pipelines:remove', '--app=example'])

    expect(stderr).to.contain(`Removing ⬢ ${app}... done\n`)
  })
})
