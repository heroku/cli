import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/spaces/info.js'
import {getGeneration} from '../../../../src/lib/apps/generation.js'
import {SpaceWithOutboundIps} from '../../../../src/lib/types/spaces.js'
import * as fixtures from '../../../fixtures/spaces/fixtures.js'

const heredoc = tsheredoc.default

type FakePlatform = {
  space: {info: sinon.SinonStub}
  spaceNat: {info: sinon.SinonStub}
  withHeaders: sinon.SinonStub
}

function buildFakePlatform(): FakePlatform {
  const spaceStub = {info: sinon.stub()}
  const spaceNatStub = {info: sinon.stub()}
  const platform: FakePlatform = {
    space: spaceStub,
    spaceNat: spaceNatStub,
    withHeaders: sinon.stub(),
  }

  platform.withHeaders.returns({space: spaceStub, spaceNat: spaceNatStub})
  return platform
}

describe('spaces:info', function () {
  let space: SpaceWithOutboundIps
  let shieldSpace: SpaceWithOutboundIps
  let fakePlatform: FakePlatform

  beforeEach(function () {
    space = fixtures.spaces['non-shield-space']
    shieldSpace = fixtures.spaces['shield-space']
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('shows space info', async function () {
    fakePlatform.space.info.resolves(space)

    const {stdout} = await runCommand(Cmd, [
      '--space',
      space.name,
    ])
    expect(fakePlatform.withHeaders.calledWith({
      Accept: 'application/vnd.heroku+json; version=3.fir',
      'Accept-Expansion': 'region',
    })).to.equal(true)
    expectOutput(stdout, heredoc(`
      === ⬡ ${space.name}
      ID:         ${space.id}
      Team:       ${space.team.name}
      Region:     ${space.region.description}
      CIDR:       ${space.cidr}
      Data CIDR:  ${space.data_cidr}
      State:      ${space.state}
      Shield:     off
      Generation: ${getGeneration(space)}
      Created at: ${space.created_at}
    `))
  })

  it('shows space info --json', async function () {
    fakePlatform.space.info.resolves(space)

    const {stdout} = await runCommand(Cmd, [
      '--space',
      space.name,
      '--json',
    ])
    expect(fakePlatform.withHeaders.calledWith({
      Accept: 'application/vnd.heroku+json; version=3.fir',
    })).to.equal(true)
    expectOutput(stdout, JSON.stringify(space, null, 2))
  })

  it('shows allocated space with enabled nat', async function () {
    fakePlatform.space.info.resolves(space)
    fakePlatform.spaceNat.info.resolves({sources: ['123.456.789.123'], state: 'enabled'})
    const {stdout} = await runCommand(Cmd, [
      '--space',
      space.name,
    ])

    expectOutput(stdout, heredoc(`
      === ⬡ ${space.name}
      ID:           ${space.id}
      Team:         ${space.team.name}
      Region:       ${space.region.description}
      CIDR:         ${space.cidr}
      Data CIDR:    ${space.data_cidr}
      State:        ${space.state}
      Shield:       off
      Outbound IPs: 123.456.789.123
      Generation:   ${getGeneration(space)}
      Created at:   ${space.created_at}
    `))
  })

  it('shows allocated space with disabled nat', async function () {
    fakePlatform.space.info.resolves(space)
    fakePlatform.spaceNat.info.resolves({sources: ['123.456.789.123'], state: 'disabled'})

    const {stdout} = await runCommand(Cmd, [
      '--space',
      space.name,
    ])
    expectOutput(stdout, heredoc(`
      === ⬡ ${space.name}
      ID:           ${space.id}
      Team:         ${space.team.name}
      Region:       ${space.region.description}
      CIDR:         ${space.cidr}
      Data CIDR:    ${space.data_cidr}
      State:        ${space.state}
      Shield:       off
      Outbound IPs: disabled
      Generation:   ${getGeneration(space)}
      Created at:   ${space.created_at}
    `))
  })

  it('shows a space with Shield turned off', async function () {
    fakePlatform.space.info.resolves(space)

    const {stdout} = await runCommand(Cmd, [
      '--space',
      space.name,
    ])
    expectOutput(stdout, heredoc(`
      === ⬡ ${space.name}
      ID:         ${space.id}
      Team:       ${space.team.name}
      Region:     ${space.region.description}
      CIDR:       ${space.cidr}
      Data CIDR:  ${space.data_cidr}
      State:      ${space.state}
      Shield:     off
      Generation: ${getGeneration(space)}
      Created at: ${space.created_at}
    `))
  })

  it('shows a space with Shield turned on', async function () {
    fakePlatform.space.info.resolves(shieldSpace)
    const {stdout} = await runCommand(Cmd, [
      '--space',
      shieldSpace.name,
    ])

    expectOutput(stdout, heredoc(`
      === ⬡ ${shieldSpace.name}
      ID:         ${shieldSpace.id}
      Team:       ${shieldSpace.team.name}
      Region:     ${shieldSpace.region.description}
      CIDR:       ${shieldSpace.cidr}
      Data CIDR:  ${shieldSpace.data_cidr}
      State:      ${shieldSpace.state}
      Shield:     on
      Generation: ${getGeneration(space)}
      Created at: ${shieldSpace.created_at}
    `))
  })

  it('test if nat API call fails ', async function () {
    fakePlatform.space.info.resolves(space)
    const {stdout} = await runCommand(Cmd, [
      '--space',
      space.name,
    ])
    expectOutput(stdout, heredoc(`
      === ⬡ ${space.name}
      ID:         ${space.id}
      Team:       ${space.team.name}
      Region:     ${space.region.description}
      CIDR:       ${space.cidr}
      Data CIDR:  ${space.data_cidr}
      State:      ${space.state}
      Shield:     off
      Generation: ${getGeneration(space)}
      Created at: ${space.created_at}
    `))
  })
})
