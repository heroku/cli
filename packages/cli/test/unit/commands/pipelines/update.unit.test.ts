import {expect} from 'chai'
import {runCommand} from '@oclif/test'
import nock from 'nock'

describe('pipelines:update', function () {
  const app = 'example'
  const id = '0123'
  const stage = 'production'
  const coupling = {id, stage}

  afterEach(function () {
    nock.cleanAll()
  })

  it('displays the right messages', async function () {
    nock('https://api.heroku.com')
      .get(`/apps/${app}/pipeline-couplings`)
      .reply(200, coupling)
      .patch(`/pipeline-couplings/${id}`)
      .reply(200, coupling)

    const {stderr} = await runCommand(['pipelines:update', `--app=${app}`, `--stage=${stage}`])

    expect(stderr).to.include(`Changing ⬢ ${app} to ${stage}... done`)
  })
})
