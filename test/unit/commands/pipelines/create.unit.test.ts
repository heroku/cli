import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import {restore, stub} from 'sinon'

import PipelinesCreate from '../../../../src/commands/pipelines/create.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

describe('pipelines:create', function () {
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

  describe('successful pipeline creation', function () {
    context('when not specifying ownership', function () {
      it('creates a pipeline with default user ownership', async function () {
        const pipeline = {id: '0123', name: 'example-pipeline', owner: {id: '1234-567', type: 'user'}}

        // getGenerationByAppId still uses this.heroku
        api.get('/apps/example-app').reply(200, {generation: 'fir', id: '0123', name: 'example-app'})

        const infoByUserStub = stub().resolves({id: '1234-567'})
        const pipelineCreateStub = stub().resolves(pipeline)
        const couplingCreateStub = stub().resolves({id: '0123', stage: 'production'})
        sdkMock = mockSDKPlatform({
          account: {infoByUser: infoByUserStub},
          pipeline: {create: pipelineCreateStub},
          pipelineCoupling: {create: couplingCreateStub},
        })

        const {stderr, stdout} = await runCommand(PipelinesCreate, [
          '--app',
          'example-app',
          '--stage',
          'production',
          'example-pipeline',
        ])

        expect(stdout).to.equal('')
        expect(stderr).to.contain('Creating example-pipeline pipeline... done')
        expect(stderr).to.contain('Adding ⬢ example-app to example-pipeline pipeline as production... done')
        expect(infoByUserStub.calledOnceWith('~')).to.be.true
        expect(pipelineCreateStub.calledOnce).to.be.true
        expect(pipelineCreateStub.firstCall.args[0]).to.deep.include({name: 'example-pipeline', owner: {id: '1234-567', type: 'user'}})
        expect(couplingCreateStub.calledOnce).to.be.true
      })
    })

    context('when specifying a team as owner', function () {
      it('creates a pipeline with team ownership', async function () {
        const pipeline = {id: '0123', name: 'example-pipeline', owner: {id: '89-0123-456', type: 'team'}}

        api.get('/apps/example-app').reply(200, {generation: 'fir', id: '0123', name: 'example-app'})

        const teamInfoStub = stub().resolves({id: '89-0123-456'})
        const pipelineCreateStub = stub().resolves(pipeline)
        const couplingCreateStub = stub().resolves({id: '0123', stage: 'production'})
        sdkMock = mockSDKPlatform({
          pipeline: {create: pipelineCreateStub},
          pipelineCoupling: {create: couplingCreateStub},
          team: {info: teamInfoStub},
        })

        const {stderr, stdout} = await runCommand(PipelinesCreate, [
          '--app',
          'example-app',
          '--stage',
          'production',
          '--team',
          'my-team',
          'example-pipeline',
        ])

        expect(stdout).to.equal('')
        expect(stderr).to.contain('Creating example-pipeline pipeline... done')
        expect(stderr).to.contain('Adding ⬢ example-app to example-pipeline pipeline as production... done')
        expect(teamInfoStub.calledOnceWith('my-team')).to.be.true
        expect(pipelineCreateStub.firstCall.args[0]).to.deep.include({name: 'example-pipeline', owner: {id: '89-0123-456', type: 'team'}})
      })
    })
  })
})
