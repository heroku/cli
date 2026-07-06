import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import {restore, stub} from 'sinon'

import Cmd from '../../../../src/commands/pipelines/promote.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

describe('pipelines:promote', function () {
  const pipeline = {
    id: '123-pipeline-456',
    name: 'example-pipeline',
  }

  const sourceApp = {
    id: '123-source-app-456',
    name: 'example-staging',
    pipeline,
  }

  const targetApp1 = {
    id: '123-target-app-456',
    name: 'example-production',
    pipeline,
  }

  const targetApp2 = {
    id: '456-target-app-789',
    name: 'example-production-eu',
    pipeline,
  }

  const sourceCoupling = {
    app: sourceApp,
    id: '123-source-app-456',
    pipeline,
    stage: 'staging',
  }

  const targetCoupling1 = {
    app: targetApp1,
    id: '123-target-app-456',
    pipeline,
    stage: 'production',
  }

  const targetCoupling2 = {
    app: targetApp2,
    id: '456-target-app-789',
    pipeline,
    stage: 'production',
  }

  const promotion = {
    id: '123-promotion-456',
    source: {app: sourceApp},
    status: 'pending',
  }

  const allApps = [
    {...sourceApp, pipelineCoupling: sourceCoupling},
    {...targetApp1, pipelineCoupling: targetCoupling1},
    {...targetApp2, pipelineCoupling: targetCoupling2},
  ]

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

  function setupMocks() {
    // getCoupling still uses this.heroku
    api.get(`/apps/${sourceApp.name}/pipeline-couplings`).reply(200, sourceCoupling)
    // listApps goes through SDK
    sdkMock = mockSDKPlatform({pipelineCoupling: {listApps: stub().resolves(allApps)}})
  }

  function stubPromote(targets: any[]) {
    return stub(Cmd, 'promotePipeline').resolves({
      promotion,
      targets,
    } as any)
  }

  it('promotes to all apps in the next stage', async function () {
    setupMocks()
    const promoteStub = stubPromote([
      {
        app: {id: targetApp1.id},
        error_message: null,
        status: 'succeeded',
      },
      {
        app: {id: targetApp2.id},
        error_message: 'Because reasons',
        status: 'failed',
      },
    ])

    const {stdout} = await runCommand(Cmd, [`--app=${sourceApp.name}`])

    expect(promoteStub.calledOnce).to.be.true
    expect(promoteStub.firstCall.args[1]).to.deep.equal({
      pipeline: {id: pipeline.id},
      source: {app: {id: sourceApp.id}},
      targets: [
        {app: {id: targetApp1.id}},
        {app: {id: targetApp2.id}},
      ],
    })
    expect(stdout).to.contain('failed')
    expect(stdout).to.contain('Because reasons')
  })

  context('passing a `to` flag', function () {
    it('can promote by app name', async function () {
      setupMocks()
      const promoteStub = stubPromote([
        {
          app: {id: targetApp1.id},
          error_message: 'Because reasons',
          status: 'failed',
        },
      ])

      const {stdout} = await runCommand(Cmd, [`--app=${sourceApp.name}`, `--to=${targetApp1.name}`])

      expect(promoteStub.firstCall.args[1].targets).to.deep.equal([{app: {id: targetApp1.id}}])
      expect(stdout).to.contain('failed')
      expect(stdout).to.contain('Because reasons')
    })

    it('can promote by app id', async function () {
      setupMocks()
      const promoteStub = stubPromote([
        {
          app: {id: targetApp1.id},
          error_message: 'Because reasons',
          status: 'failed',
        },
      ])

      const {stdout} = await runCommand(Cmd, [`--app=${sourceApp.name}`, `--to=${targetApp1.id}`])

      expect(promoteStub.firstCall.args[1].targets).to.deep.equal([{app: {id: targetApp1.id}}])
      expect(stdout).to.contain('failed')
      expect(stdout).to.contain('Because reasons')
    })
  })

  context('with release phase', function () {
    it('streams the release command output to stdout', async function () {
      setupMocks()
      const streamBody = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('Release Command Output'))
          controller.close()
        },
      })
      const promoteStub = stub(Cmd, 'promotePipeline').callsFake(async (_ctx, _body, options) => {
        await options!.onReleaseStream!({
          stream: streamBody,
          target: {
            app: {id: targetApp1.id}, error_message: null, id: 'target-1', pipeline_promotion: {id: 'promo-1'}, release: {id: 'release-1'}, status: 'pending',
          },
        })
        return {
          promotion,
          targets: [{
            app: {id: targetApp1.id},
            error_message: null,
            status: 'succeeded',
          }],
        } as any
      })

      const {stdout} = await runCommand(Cmd, [`--app=${sourceApp.name}`])

      expect(promoteStub.calledOnce).to.be.true
      expect(stdout).to.contain('Running release command')
      expect(stdout).to.contain('Release Command Output')
      expect(stdout).to.contain('succeeded')
    })
  })

  context('with release phase that errors', function () {
    it('surfaces the SDK stream error', async function () {
      setupMocks()
      stub(Cmd, 'promotePipeline').rejects(new Error('stream release output not available'))

      const {error} = await runCommand(Cmd, [`--app=${sourceApp.name}`])

      expect(error?.message).to.equal('stream release output not available')
    })
  })
})
