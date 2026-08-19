import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {stub} from 'sinon'

import Transfer from '../../../../src/commands/spaces/transfer.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

describe('spaces:transfer', function () {
  let transferStub: ReturnType<typeof stub>
  let sdkMock: MockSDK

  beforeEach(function () {
    transferStub = stub()
    sdkMock = mockSDKPlatform({spaceTransfer: {transfer: transferStub}})
  })

  afterEach(function () {
    sdkMock.restore()
  })

  it('yields success when the API succeeds', async function () {
    const space = 'dimension-c137'
    const team = 'jerry'
    transferStub.resolves({
      cidr: '10.0.0.0/16',
      created_at: '2019-01-09T22:31:33Z',
      data_cidr: '10.1.0.0/16',
      id: '5dd30c44-078f-4424-8585-cb98adf86723',
      name: space,
      organization: {id: '12cd6520-b000-4882-a655-8ae84a0132cb', name: team},
      region: {id: '3544427c-5b3b-4e1e-b01a-b66362573b26', name: 'virginia'},
      shield: false,
      state: 'allocated',
      team: {id: '12cd6520-b000-4882-a655-8ae84a0132cb', name: team},
      updated_at: '2019-07-16T10:19:10Z',
    })

    const {stderr} = await runCommand(Transfer, ['--team', team, '--space', space])

    expect(transferStub.calledOnceWith(space, {new_owner: team})).to.equal(true)
    expect(stderr).to.contain('done')
  })

  it('yields the API error messages when the API fails', async function () {
    const space = 'dimension-c137'
    const team = 'jerry'
    const message = 'rikki tikki tavi!'
    // Simulates heroku-fetch's HerokuApiError shape, which sets `.message` directly
    // (rather than the old `error.body.message` destructuring this command used previously).
    transferStub.rejects(new Error(message))

    const {error} = await runCommand(Transfer, ['--team', team, '--space', space])

    expect(error?.message).to.eq(message)
  })
})
