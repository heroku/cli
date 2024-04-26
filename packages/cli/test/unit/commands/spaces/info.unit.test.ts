import {stdout} from 'stdout-stderr'
import Cmd from '../../../../src/commands/spaces/info'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import heredoc from 'tsheredoc'
import expectOutput from '../../../helpers/utils/expectOutput'
import * as fixtures from '../../../fixtures/spaces/fixtures'

describe('spaces:info', function () {
  const space = fixtures.spaces['non-shield-space']
  const shieldSpace = fixtures.spaces['shield-space']

  it('shows space info', async function () {
    nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'region'}})
      .get(`/spaces/${space.name}`)
      .reply(200, space)

    await runCommand(Cmd, [
      '--space',
      space.name,
    ])
    expectOutput(stdout.output, heredoc(`
      === ${space.name}
      ID:           ${space.id}
      Team:         ${space.team.name}
      Region:       ${space.region.description}
      CIDR:         ${space.cidr}
      Data CIDR:    ${space.data_cidr}
      State:        ${space.state}
      Shield:       off
      Created at:   ${space.created_at}
    `))
  })

  it('shows space info --json', async function () {
    nock('https://api.heroku.com:443')
      .get(`/spaces/${space.name}`)
      .reply(200, space)

    await runCommand(Cmd, [
      '--space',
      space.name,
      '--json',
    ])
    expectOutput(stdout.output, JSON.stringify(space, null, 2))
  })

  it('shows allocated space with enabled nat', async function () {
    nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'region'}})
      .get(`/spaces/${space.name}`)
      .reply(200, space)
    nock('https://api.heroku.com')
      .get(`/spaces/${space.name}/nat`)
      .reply(200, {state: 'enabled', sources: ['123.456.789.123']})
    await runCommand(Cmd, [
      '--space',
      space.name,
    ])

    expectOutput(stdout.output, heredoc(`
      === ${space.name}
      ID:           ${space.id}
      Team:         ${space.team.name}
      Region:       ${space.region.description}
      CIDR:         ${space.cidr}
      Data CIDR:    ${space.data_cidr}
      State:        ${space.state}
      Shield:       off
      Outbound IPs: 123.456.789.123
      Created at:   ${space.created_at}
    `))
  })

  it('shows allocated space with disabled nat', async function () {
    nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'region'}})
      .get(`/spaces/${space.name}`)
      .reply(200, space)
    nock('https://api.heroku.com')
      .get(`/spaces/${space.name}/nat`)
      .reply(200, {state: 'disabled', sources: ['123.456.789.123']})

    await runCommand(Cmd, [
      '--space',
      space.name,
    ])
    expectOutput(stdout.output, heredoc(`
      === ${space.name}
      ID:           ${space.id}
      Team:         ${space.team.name}
      Region:       ${space.region.description}
      CIDR:         ${space.cidr}
      Data CIDR:    ${space.data_cidr}
      State:        ${space.state}
      Shield:       off
      Outbound IPs: disabled
      Created at:   ${space.created_at}
    `))
  })

  it('shows a space with Shield turned off', async function () {
    nock('https://api.heroku.com:443')
      .get(`/spaces/${space.name}`)
      .reply(200, space)

    await runCommand(Cmd, [
      '--space',
      space.name,
    ])
    expectOutput(stdout.output, heredoc(`
      === ${space.name}
      ID:           ${space.id}
      Team:         ${space.team.name}
      Region:       ${space.region.description}
      CIDR:         ${space.cidr}
      Data CIDR:    ${space.data_cidr}
      State:        ${space.state}
      Shield:       off
      Created at:   ${space.created_at}
    `))
  })

  it('shows a space with Shield turned on', async function () {
    nock('https://api.heroku.com')
      .get(`/spaces/${shieldSpace.name}`)
      .reply(200, shieldSpace)
    await runCommand(Cmd, [
      '--space',
      shieldSpace.name,
    ])

    expectOutput(stdout.output, heredoc(`
      === ${shieldSpace.name}
      ID:           ${shieldSpace.id}
      Team:         ${shieldSpace.team.name}
      Region:       ${shieldSpace.region.description}
      CIDR:         ${shieldSpace.cidr}
      Data CIDR:    ${shieldSpace.data_cidr}
      State:        ${shieldSpace.state}
      Shield:       on
      Created at:   ${shieldSpace.created_at}
    `))
  })

  it('test if nat API call fails ', async function () {
    nock('https://api.heroku.com')
      .get(`/spaces/${space.name}`)
      .reply(200, space)
    await runCommand(Cmd, [
      '--space',
      space.name,
    ])
    expectOutput(stdout.output, heredoc(`
      === ${space.name}
      ID:           ${space.id}
      Team:         ${space.team.name}
      Region:       ${space.region.description}
      CIDR:         ${space.cidr}
      Data CIDR:    ${space.data_cidr}
      State:        ${space.state}
      Shield:       off
      Created at:   ${space.created_at}
    `))
  })
})
