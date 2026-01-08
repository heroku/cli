import {hux} from '@heroku/heroku-cli-util'
import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'
import {stderr} from 'stdout-stderr'

import TransferCommand from '../../../../src/commands/pipelines/transfer.js'
import runCommandHelper from '../../../helpers/runCommand.js'

describe('pipelines:transfer', function () {
  const pipeline = {
    id: 'd214bea8-aaa0-4f98-91ba-e781cb26d50f',
    name: 'test-pipeline',
  }

  const team = {
    id: 'caee7555-c3ba-4959-a393-a0ae93bb958f',
    name: 'foo-team',
  }

  const account = {
    email: 'user@example.com',
    id: 'bcf91aa0-9465-4ad8-a38f-983cd177780f',
  }

  const coupling = {
    app: {
      id: '579a2433-7afd-421c-8b87-1b89b5cfbf10',
    },
  }

  const app = {
    id: coupling.app.id,
    name: 'my-app',
  }

  afterEach(function () {
    nock.cleanAll()
    sinon.restore()
  })

  function setupCommonMocks() {
    nock('https://api.heroku.com')
      .get(`/pipelines/${pipeline.id}`)
      .reply(200, pipeline)
      .get(`/pipelines/${pipeline.id}/pipeline-couplings`)
      .reply(200, [coupling])
      .post('/filters/apps')
      .reply(200, [app])
  }

  it('transfers to a team', async function () {
    this.retries(2)

    setupCommonMocks()

    const transferNock = nock('https://api.heroku.com')
      .get(`/teams/${team.name}`)
      .reply(200, team)
      .post('/pipeline-transfers', {
        new_owner: {id: team.id, type: 'team'},
        pipeline: {id: pipeline.id},
      })
      .reply(200, {})

    const {stderr} = await runCommand(['pipelines:transfer', `--pipeline=${pipeline.id}`, `--confirm=${pipeline.name}`, team.name])

    expect(stderr).to.include(`Transferring ${pipeline.name} pipeline to the ${team.name} team... done`)
    expect(transferNock.isDone()).to.be.true
  })

  it('transfers to an account', async function () {
    setupCommonMocks()

    const transferNock = nock('https://api.heroku.com')
      .get(`/users/${account.email}`)
      .reply(200, account)
      .post('/pipeline-transfers', {
        new_owner: {id: account.id, type: 'user'},
        pipeline: {id: pipeline.id},
      })
      .reply(200, {})

    const {stderr} = await runCommand(['pipelines:transfer', `--pipeline=${pipeline.id}`, `--confirm=${pipeline.name}`, account.email])

    expect(stderr).to.include(`Transferring ${pipeline.name} pipeline to the ${account.email} account... done`)
    expect(transferNock.isDone()).to.be.true
  })

  it('does not pass confirm flag', async function () {
    const promptStub = sinon.stub(hux, 'prompt').onFirstCall().resolves(pipeline.name)

    setupCommonMocks()

    const transferNock = nock('https://api.heroku.com')
      .get(`/users/${account.email}`)
      .reply(200, account)
      .post('/pipeline-transfers', {
        new_owner: {id: account.id, type: 'user'},
        pipeline: {id: pipeline.id},
      })
      .reply(200, {})

    await runCommandHelper(TransferCommand, [`--pipeline=${pipeline.id}`, account.email])

    expect(stderr.output).to.include(`Transferring ${pipeline.name} pipeline to the ${account.email} account... done`)
    expect(transferNock.isDone()).to.be.true
    expect(promptStub.calledOnce).to.be.true
  })
})
