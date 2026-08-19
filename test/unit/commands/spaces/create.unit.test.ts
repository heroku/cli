import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/spaces/create.js'
import {getGeneration} from '../../../../src/lib/apps/generation.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'
import {unwrap} from '../../../helpers/utils/unwrap.js'

const heredoc = tsheredoc.default

describe('spaces:create', function () {
  const now = new Date()
  const features = ['one', 'two']
  let createStub: ReturnType<typeof stub>
  let sdkMock: MockSDK

  beforeEach(function () {
    createStub = stub()
    sdkMock = mockSDKPlatform({space: {create: createStub}})
  })

  afterEach(function () {
    sdkMock.restore()
  })

  it('creates a Standard space', async function () {
    createStub.resolves({
      cidr: '10.0.0.0/16',
      created_at: now.toISOString(),
      data_cidr: '172.23.0.0/20',
      features: ['one', 'two'],
      generation: 'cedar',
      name: 'my-space',
      region: {name: 'my-region'},
      shield: false,
      state: 'allocated',
      team: {name: 'my-team'},
    })

    const {stdout} = await runCommand(Cmd, [
      '--team=my-team',
      '--space=my-space',
      '--region=my-region',
      '--features=one, two',
    ])

    expect(createStub.calledOnce).to.equal(true)
    const requestBody = createStub.firstCall.args[0]
    expect(requestBody.name).to.eq('my-space')
    expect(requestBody.team).to.eq('my-team')
    expect(requestBody.region).to.eq('my-region')
    expect(requestBody.features).to.deep.eq(features)
    expect(requestBody.generation).to.eq('cedar')

    expect(stdout).to.eq(heredoc`
      === ⬡ my-space

      Team:       my-team
      Region:     my-region
      CIDR:       10.0.0.0/16
      Data CIDR:  172.23.0.0/20
      State:      allocated
      Shield:     off
      Generation: cedar
      Created at: ${now.toISOString()}
    `)
  })

  it('shows Standard Private Space Add-on cost warning', async function () {
    createStub.resolves({
      cidr: '10.0.0.0/16',
      created_at: now.toISOString(),
      data_cidr: '172.23.0.0/20',
      features: ['one', 'two'],
      generation: 'cedar',
      name: 'my-space',
      region: {name: 'my-region'},
      shield: false,
      state: 'allocated',
      team: {name: 'my-team'},
    })

    const {stderr} = await runCommand(Cmd, [
      '--team=my-team',
      '--space=my-space',
      '--region=my-region',
      '--features=one, two',
    ])

    expect(unwrap(stderr)).to.include('Warning: Spend Alert. Each Heroku Standard Private Space costs ~$1.39/hour (max $1000/month), pro-rated to the second.')
  })

  it('creates a Shield space', async function () {
    createStub.resolves({
      cidr: '10.0.0.0/16',
      created_at: now.toISOString(),
      data_cidr: '172.23.0.0/20',
      features: ['one', 'two'],
      generation: 'cedar',
      name: 'my-space',
      region: {name: 'my-region'},
      shield: true,
      state: 'allocated',
      team: {name: 'my-team'},
    })

    const {stdout} = await runCommand(Cmd, [
      '--team=my-team',
      '--space=my-space',
      '--region=my-region',
      '--features=one, two',
      '--shield',
    ])

    const requestBody = createStub.firstCall.args[0]
    expect(requestBody.shield).to.eq(true)

    expect(stdout).to.eq(heredoc`
      === ⬡ my-space

      Team:       my-team
      Region:     my-region
      CIDR:       10.0.0.0/16
      Data CIDR:  172.23.0.0/20
      State:      allocated
      Shield:     on
      Generation: cedar
      Created at: ${now.toISOString()}
    `)
  })

  it('shows Shield Private Space Add-on cost warning', async function () {
    createStub.resolves({
      cidr: '10.0.0.0/16',
      created_at: now.toISOString(),
      data_cidr: '172.23.0.0/20',
      features: ['one', 'two'],
      generation: 'cedar',
      name: 'my-space',
      region: {name: 'my-region'},
      shield: true,
      state: 'allocated',
      team: {name: 'my-team'},
    })

    const {stderr} = await runCommand(Cmd, [
      '--team=my-team',
      '--space=my-space',
      '--region=my-region',
      '--features=one, two',
      '--shield',
    ])

    expect(unwrap(stderr)).to.include('Warning: Spend Alert. Each Heroku Shield Private Space costs ~$4.17/hour (max $3000/month), pro-rated to the second.')
  })

  it('creates a space with custom cidr and data cidr', async function () {
    createStub.resolves({
      cidr: '10.0.0.0/24',
      created_at: now.toISOString(),
      data_cidr: '172.23.0.0/28',
      features: ['one', 'two'],
      name: 'my-space',
      region: {name: 'my-region'},
      shield: false,
      state: 'allocated',
      team: {name: 'my-team'},
    })

    const {stdout} = await runCommand(Cmd, [
      '--team=my-team',
      '--space=my-space',
      '--region=my-region',
      '--features=one, two',
      '--cidr=10.0.0.0/24',
      '--data-cidr=172.23.0.0/28',
    ])

    const requestBody = createStub.firstCall.args[0]
    expect(requestBody.cidr).to.eq('10.0.0.0/24')
    expect(requestBody.data_cidr).to.eq('172.23.0.0/28')

    expect(stdout).to.eq(heredoc`
      === ⬡ my-space

      Team:       my-team
      Region:     my-region
      CIDR:       10.0.0.0/24
      Data CIDR:  172.23.0.0/28
      State:      allocated
      Shield:     off
      Created at: ${now.toISOString()}
    `)
  })

  it('creates a fir space', async function () {
    const firSpace = {
      cidr: '10.0.0.0/16',
      created_at: now.toISOString(),
      data_cidr: '172.23.0.0/20',
      features: ['one', 'two'],
      generation: 'fir',
      name: 'my-space',
      region: {name: 'my-region'},
      shield: false,
      state: 'allocated',
      team: {name: 'my-team'},
    }
    createStub.resolves(firSpace)

    const {stdout} = await runCommand(Cmd, [
      '--team',
      firSpace.team.name,
      '--space',
      firSpace.name,
      '--region',
      firSpace.region.name,
      '--features',
      firSpace.features.join(','),
      '--generation',
      getGeneration(firSpace)!,
    ])

    const requestBody = createStub.firstCall.args[0]
    expect(requestBody.generation).to.eq(getGeneration(firSpace))

    expect(stdout).to.eq(heredoc`
      === ⬡ ${firSpace.name}

      Team:       ${firSpace.team.name}
      Region:     ${firSpace.region.name}
      CIDR:       ${firSpace.cidr}
      Data CIDR:  ${firSpace.data_cidr}
      State:      ${firSpace.state}
      Shield:     off
      Generation: ${getGeneration(firSpace)!}
      Created at: ${now.toISOString()}
    `)
  })
})
