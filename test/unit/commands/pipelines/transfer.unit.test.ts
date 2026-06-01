import {runCommand} from '@heroku-cli/test-utils'
import {hux} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import nock from 'nock'
import {restore, stub} from 'sinon'

import TransferCommand from '../../../../src/commands/pipelines/transfer.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

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
    pipelineCoupling: coupling,
  }

  let api: nock.Scope
  let sdkMock: MockSDK

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
    sdkMock.restore()
    restore()
  })

  function setupSDKMocks() {
    const infoStub = stub().resolves(pipeline)
    const listAppsStub = stub().resolves([app])
    sdkMock = mockSDKPlatform({
      pipeline: {info: infoStub},
      pipelineCoupling: {listApps: listAppsStub},
    })
  }

  it('transfers to a team', async function () {
    this.retries(2)

    setupSDKMocks()

    api
      .get(`/teams/${team.name}`)
      .reply(200, team)
      .post('/pipeline-transfers', {
        new_owner: {id: team.id, type: 'team'},
        pipeline: {id: pipeline.id},
      })
      .reply(200, {})

    const {stderr} = await runCommand(TransferCommand, [`--pipeline=${pipeline.id}`, `--confirm=${pipeline.name}`, team.name])

    expect(stderr).to.include(`Transferring ${pipeline.name} pipeline to the ${team.name} team... done`)
  })

  it('transfers to an account', async function () {
    setupSDKMocks()

    api
      .get(`/users/${account.email}`)
      .reply(200, account)
      .post('/pipeline-transfers', {
        new_owner: {id: account.id, type: 'user'},
        pipeline: {id: pipeline.id},
      })
      .reply(200, {})

    const {stderr} = await runCommand(TransferCommand, [`--pipeline=${pipeline.id}`, `--confirm=${pipeline.name}`, account.email])

    expect(stderr).to.include(`Transferring ${pipeline.name} pipeline to the ${account.email} account... done`)
  })

  it('does not pass confirm flag', async function () {
    const promptStub = stub(hux, 'prompt').onFirstCall().resolves(pipeline.name)

    setupSDKMocks()

    api
      .get(`/users/${account.email}`)
      .reply(200, account)
      .post('/pipeline-transfers', {
        new_owner: {id: account.id, type: 'user'},
        pipeline: {id: pipeline.id},
      })
      .reply(200, {})

    const {stderr} = await runCommand(TransferCommand, [`--pipeline=${pipeline.id}`, account.email])

    expect(stderr).to.include(`Transferring ${pipeline.name} pipeline to the ${account.email} account... done`)
    expect(promptStub.calledOnce).to.be.true
  })
})
