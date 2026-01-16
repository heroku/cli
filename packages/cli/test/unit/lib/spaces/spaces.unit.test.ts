import * as Heroku from '@heroku-cli/schema'
import {expect} from 'chai'
import {stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import {displayNat, displayShieldState, renderInfo} from '../../../../src/lib/spaces/spaces.js'
import {SpaceNat} from '../../../../src/lib/types/fir.js'
import * as fixtures from '../../../fixtures/spaces/fixtures.js'
import expectOutput from '../../../helpers/utils/expectOutput.js'

const heredoc = tsheredoc.default

describe('displayShieldState', function () {
  it('returns "on" when shield is true', function () {
    const space: Heroku.Space = {shield: true}
    expect(displayShieldState(space)).to.equal('on')
  })

  it('returns "off" when shield is false', function () {
    const space: Heroku.Space = {shield: false}
    expect(displayShieldState(space)).to.equal('off')
  })

  it('returns "off" when shield is undefined', function () {
    const space: Heroku.Space = {}
    expect(displayShieldState(space)).to.equal('off')
  })
})

describe('displayNat', function () {
  it('returns undefined when NAT is undefined', function () {
    expect(displayNat(undefined)).to.be.undefined
  })

  it('returns state when NAT state is updating', function () {
    const nat: SpaceNat = {
      created_at: '2024-01-01T00:00:00Z',
      sources: [],
      state: 'updating',
      updated_at: '2024-01-01T00:00:00Z',
    }
    expect(displayNat(nat)).to.equal('updating')
  })

  it('returns state when NAT state is disabled', function () {
    const nat: SpaceNat = {
      created_at: '2024-01-01T00:00:00Z',
      sources: [],
      state: 'disabled',
      updated_at: '2024-01-01T00:00:00Z',
    }
    expect(displayNat(nat)).to.equal('disabled')
  })

  it('returns empty string when NAT is enabled with no IPs', function () {
    const nat: SpaceNat = {
      created_at: '2024-01-01T00:00:00Z',
      sources: [],
      state: 'enabled',
      updated_at: '2024-01-01T00:00:00Z',
    }
    expect(displayNat(nat)).to.equal('')
  })

  it('returns a single IP when NAT is enabled with one IP', function () {
    const nat: SpaceNat = {
      created_at: '2024-01-01T00:00:00Z',
      sources: ['1.2.3.4'],
      state: 'enabled',
      updated_at: '2024-01-01T00:00:00Z',
    }
    expect(displayNat(nat)).to.equal('1.2.3.4')
  })

  it('returns comma-separated IPs when NAT is enabled with multiple IPs', function () {
    const nat: SpaceNat = {
      created_at: '2024-01-01T00:00:00Z',
      sources: ['1.2.3.4', '5.6.7.8', '9.10.11.12'],
      state: 'enabled',
      updated_at: '2024-01-01T00:00:00Z',
    }
    expect(displayNat(nat)).to.equal('1.2.3.4, 5.6.7.8, 9.10.11.12')
  })
})

describe('renderInfo', function () {
  const space = Object.assign({}, fixtures.spaces['non-shield-space'], {outbound_ips: {sources: ['123.456.789.123'], state: 'enabled'}})

  it('outputs space info in JSON format when json flag is true', function () {
    stdout.start()
    renderInfo(space, true)
    stdout.stop()
    expect(JSON.parse(stdout.output)).to.eql(space)
  })

  it('outputs space info in styled format when json flag is false', function () {
    stdout.start()
    renderInfo(space, false)
    stdout.stop()

    expectOutput(stdout.output, heredoc(`
      === ⬡ ${space.name}
      ID:           ${space.id}
      Team:         ${space.team.name}
      Region:       ${space.region.description}
      CIDR:         ${space.cidr}
      Data CIDR:    ${space.data_cidr}
      State:        ${space.state}
      Shield:       off
      Outbound IPs: 123.456.789.123
      Generation:   cedar
      Created at:   ${space.created_at}
    `))
  })
})
