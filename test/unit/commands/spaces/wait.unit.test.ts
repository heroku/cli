import {expect} from 'chai'
import nock from 'nock'
import * as sinon from 'sinon'
import {stderr, stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/spaces/wait.js'
import {getGeneration} from '../../../../src/lib/apps/generation.js'
import {SpaceWithOutboundIps} from '../../../../src/lib/types/spaces.js'
import * as fixtures from '../../../fixtures/spaces/fixtures.js'
import runCommand from '../../../helpers/runCommand.js'
import expectOutput from '../../../helpers/utils/expectOutput.js'

const heredoc = tsheredoc.default

describe('spaces:wait', function () {
  let allocatingSpace: SpaceWithOutboundIps
  let allocatedSpace: SpaceWithOutboundIps
  let sandbox: sinon.SinonSandbox
  let notifyStub: sinon.SinonStub
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    sandbox = sinon.createSandbox()
    notifyStub = sandbox.stub(Cmd.prototype, 'notify' as any)
    allocatingSpace = fixtures.spaces['allocating-space']
    allocatedSpace = fixtures.spaces['non-shield-space']
  })

  afterEach(function () {
    nock.cleanAll()
    api.done()
    sandbox.restore()
  })

  it('waits for space to allocate and then shows space info', async function () {
    nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'region'}})
      .get(`/spaces/${allocatingSpace.name}`)
      .reply(200, allocatingSpace)
      .get(`/spaces/${allocatingSpace.name}`)
      .reply(200, allocatedSpace)
    api
      .get(`/spaces/${allocatedSpace.name}/nat`)
      .reply(200, {sources: ['123.456.789.123'], state: 'enabled'})

    await runCommand(Cmd, [
      '--space',
      allocatedSpace.name,
      '--interval',
      '0',
    ])
    expectOutput(stderr.output, heredoc(`
      Waiting for space ⬡ ${allocatedSpace.name} to allocate... done
    `))
    expectOutput(stdout.output, heredoc(`
      === ⬡ ${allocatedSpace.name}
      ID:           ${allocatedSpace.id}
      Team:         ${allocatedSpace.team.name}
      Region:       ${allocatedSpace.region.description}
      CIDR:         ${allocatedSpace.cidr}
      Data CIDR:    ${allocatedSpace.data_cidr}
      State:        ${allocatedSpace.state}
      Shield:       off
      Outbound IPs: 123.456.789.123
      Generation:   ${getGeneration(allocatedSpace)}
      Created at:   ${allocatedSpace.created_at}
    `))
    expect(notifyStub.called).to.be.true
    expect(notifyStub.calledOnce).to.be.true
  })

  it('waits for space with --json', async function () {
    api
      .get(`/spaces/${allocatingSpace.name}`)
      .reply(200, allocatingSpace)
      .get(`/spaces/${allocatedSpace.name}`)
      .reply(200, allocatedSpace)
    api
      .get(`/spaces/${allocatedSpace.name}/nat`)
      .reply(200, {sources: ['123.456.789.123'], state: 'enabled'})

    await runCommand(Cmd, [
      '--space',
      allocatedSpace.name,
      '--json',
      '--interval',
      '0',
    ])
    const allocatedSpaceWithOutboundIPs = {
      ...allocatedSpace,
      outbound_ips: {sources: ['123.456.789.123'], state: 'enabled'},
    }
    expectOutput(stderr.output, heredoc(`
      Waiting for space ⬡ ${allocatedSpace.name} to allocate... done
    `))
    expectOutput(stdout.output, JSON.stringify(allocatedSpaceWithOutboundIPs, null, 2))
  })

  it('not failing when nat is unavailable for space which is allocated', async function () {
    nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'region'}})
      .get(`/spaces/${allocatedSpace.name}`)
      .reply(200, allocatedSpace)
    api
      .get(`/spaces/${allocatedSpace.name}/nat`)
      .reply(503, {})

    await runCommand(Cmd, [
      '--space',
      allocatedSpace.name,
      '--interval',
      '0',
    ])
    expectOutput(stdout.output, heredoc(`
      === ⬡ ${allocatedSpace.name}
      ID:           ${allocatedSpace.id}
      Team:         ${allocatedSpace.team.name}
      Region:       ${allocatedSpace.region.description}
      CIDR:         ${allocatedSpace.cidr}
      Data CIDR:    ${allocatedSpace.data_cidr}
      State:        ${allocatedSpace.state}
      Shield:       off
      Generation:   ${getGeneration(allocatedSpace)}
      Created at:   ${allocatedSpace.created_at}
    `))
    expect(notifyStub.called).to.be.true
    expect(notifyStub.calledOnce).to.be.true
  })
})
