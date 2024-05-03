'use strict'
const cli = require('@heroku/heroku-cli-util')

function displayNat(nat) {
  if (!nat) return
  if (nat.state !== 'enabled') return nat.state
  return nat.sources.join(', ')
}

function displayShieldState(space) {
  return space.shield ? 'on' : 'off'
}

function renderInfo(space, flags) {
  if (flags.json) {
    cli.log(JSON.stringify(space, null, 2))
  } else {
    cli.styledHeader(space.name)
    cli.styledObject({
      ID: space.id,
      Team: space.team.name,
      Region: space.region.description,
      CIDR: space.cidr,
      'Data CIDR': space.data_cidr,
      State: space.state,
      Shield: displayShieldState(space),
      'Outbound IPs': displayNat(space.outbound_ips),
      'Created at': space.created_at,
    }, ['ID', 'Team', 'Region', 'CIDR', 'Data CIDR', 'State', 'Shield', 'Outbound IPs', 'Created at'])
  }
}

exports.renderInfo = renderInfo
exports.displayNat = displayNat
exports.displayShieldState = displayShieldState
