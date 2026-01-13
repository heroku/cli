import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('pipelines:update', function () {
  const app = 'example'
  const id = '0123'
  const stage = 'production'
  const coupling = {id, stage}
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
      .get(`/apps/${app}/pipeline-couplings`)
      .reply(200, coupling)
      .patch(`/pipeline-couplings/${id}`)
      .reply(200, coupling)

    const {stderr} = await runCommand(['pipelines:update', `--app=${app}`, `--stage=${stage}`])

    expect(stderr).to.include(`Changing ⬢ ${app} to ${stage}... done`)
  })
})
