import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

export function displayShieldState(space: Heroku.Space) {
  return space.shield ? 'on' : 'off'
}

export function displayNat(nat?: Required<Heroku.SpaceNetworkAddressTranslation>) {
  if (!nat) return
  if (nat.state !== 'enabled') return nat.state
  return nat.sources.join(', ')
}

export function renderInfo(space: Heroku.Space, json: boolean) {
  if (json) {
    ux.log(JSON.stringify(space, null, 2))
  } else {
    ux.styledHeader(space.name || '')
    ux.styledObject(
      {
        ID: space.id,
        Team: space.team?.name,
        Region: space.region?.description,
        CIDR: space.cidr,
        'Data CIDR': space.data_cidr,
        State: space.state,
        Shield: displayShieldState(space),
        'Outbound IPs': displayNat(space.outbound_ips),
        Generation: space.generation,
        'Created at': space.created_at,
      },
      ['ID', 'Team', 'Region', 'CIDR', 'Data CIDR', 'State', 'Shield', 'Outbound IPs', 'Generation', 'Created at'],
    )
  }
}
