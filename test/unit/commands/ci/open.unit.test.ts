import {runCommand} from '@heroku-cli/test-utils'
import {hux} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import nock from 'nock'
import {restore, SinonStub, stub} from 'sinon'

import CiOpen from '../../../../src/commands/ci/open.js'

describe('ci:open', function () {
  const pipeline = {id: '14402644-c207-43aa-9bc1-974a34914010', name: 'pipeline'}
  let api: nock.Scope
  let openUrlStub: SinonStub

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    openUrlStub = stub(hux, 'openUrl').resolves(true)
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
    restore()
  })

  it('opens the pipeline tests page in the dashboard without prompting', async function () {
    api
      .get(`/pipelines?eq[name]=${pipeline.name}`)
      .reply(200, [pipeline])

    const {stdout} = await runCommand(CiOpen, ['--pipeline', pipeline.name])

    expect(openUrlStub.calledOnceWithExactly(`https://dashboard.heroku.com/pipelines/${pipeline.id}/tests`, {prompt: false})).to.be.true
    expect(stdout).to.equal('')
  })

  it('exits 1 when the browser launcher can\'t be started', async function () {
    api
      .get(`/pipelines?eq[name]=${pipeline.name}`)
      .reply(200, [pipeline])
    openUrlStub.resolves(false)

    const {error} = await runCommand(CiOpen, ['--pipeline', pipeline.name])

    expect(error?.oclif?.exit).to.equal(1)
  })
})
