import {App} from '@heroku-cli/schema'
import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import type {SpaceTopology} from '../../../../src/lib/types/spaces.js'

import Cmd from '../../../../src/commands/spaces/topology.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'
import * as fixtures from '../../../fixtures/spaces/fixtures.js'

const heredoc = tsheredoc.default

describe('spaces:topology', function () {
  let topo1: SpaceTopology
  let topo2: SpaceTopology
  let topo3: SpaceTopology
  let app: App
  let topologyStub: ReturnType<typeof stub>
  let appInfoStub: ReturnType<typeof stub>
  let sdkMock: MockSDK

  beforeEach(function () {
    topo1 = fixtures.topologies['topology-one']
    topo2 = fixtures.topologies['topology-two']
    topo3 = fixtures.topologies['topology-three']
    app = fixtures.apps.www
    topologyStub = stub()
    appInfoStub = stub()
    sdkMock = mockSDKPlatform({
      app: {info: appInfoStub},
      spaceTopology: {topology: topologyStub},
    })
    appInfoStub.resolves(app)
  })

  afterEach(function () {
    sdkMock.restore()
  })

  it('shows space topology', async function () {
    topologyStub.resolves(topo1)

    const {stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
    ])
    expect(topologyStub.calledOnceWith('my-space')).to.equal(true)
    expect(appInfoStub.calledOnceWith(app.id)).to.equal(true)
    expectOutput(stdout, heredoc(`
      === ${app.name} (web)
      Domains: example.com
               example.net
      Dynos:   web.1 - 10.0.134.42 - 1.example-app-90210.app.localspace
               web.2 - 10.0.134.42 - 1.example-app-90210.app.localspace
    `))
  })

  it('shows space topology with first dyno having higher process number', async function () {
    topologyStub.resolves(topo2)

    const {stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
    ])
    expectOutput(stdout, heredoc(`
      === ${app.name} (web)
      Domains: example.com
               example.net
      Dynos:   web.1 - 10.0.134.42 - 1.example-app-90210.app.localspace
               web.2 - 10.0.134.42 - 1.example-app-90210.app.localspace
    `))
  })

  it('shows space topology with dynos having same process number', async function () {
    topologyStub.resolves(topo3)

    const {stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
    ])
    expectOutput(stdout, heredoc(`
      === ${app.name} (web)
      Domains: example.com
               example.net
      Dynos:   web.1 - 10.0.134.42 - 1.example-app-90210.app.localspace
               web.1 - 10.0.134.42 - 1.example-app-90210.app.localspace
    `))
  })

  it('shows space topology  --json', async function () {
    topologyStub.resolves(topo1)

    const {stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
      '--json',
    ])
    expect(JSON.parse(stdout)).to.eql(topo1)
  })
})
