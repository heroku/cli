import {expect} from 'chai'
import {runCommand} from '@oclif/test'
import nock from 'nock'

describe('pipelines:remove', function () {
  const app = 'example'
  const id = '0123'
  const coupling = {id, stage: 'production'}

  afterEach(function () {
    nock.cleanAll()
  })

  it('displays the right messages', async function () {
    this.retries(3)

    nock('https://api.heroku.com')
      .get(`/apps/${app}/pipeline-couplings`)
      .reply(200, coupling)
      .delete(`/pipeline-couplings/${id}`)
      .reply(200, coupling)

    const {stderr} = await runCommand(['pipelines:remove', '--app=example'])

    expect(stderr).to.contain(`Removing ⬢ ${app}... done\n`)
  })
})
