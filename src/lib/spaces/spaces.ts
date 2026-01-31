import {color, hux} from '@heroku/heroku-cli-util'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

import {getGeneration} from '../apps/generation.js'
import {SpaceNat} from '../types/fir.js'
import {SpaceWithOutboundIps} from '../types/spaces.js'

export function displayShieldState(space: Heroku.Space) {
  return space.shield ? 'on' : 'off'
}

export function displayNat(nat?: Required<SpaceNat>) {
  if (!nat) return
  if (nat.state !== 'enabled') return nat.state
  return nat.sources.join(', ')
}

export function renderInfo(space: SpaceWithOutboundIps, json: boolean) {
  if (json) {
    ux.stdout(JSON.stringify(space, null, 2))
  } else {
    hux.styledHeader(color.space(space.name || ''))
    hux.styledObject(
      {
        ID: space.id,
        Team: space.team?.name,
        Region: space.region?.description,
        CIDR: space.cidr,
        'Data CIDR': space.data_cidr,
        State: space.state,
        Shield: displayShieldState(space),
        'Outbound IPs': displayNat(space.outbound_ips),
        Generation: getGeneration(space),
        'Created at': space.created_at,
      },
      ['ID', 'Team', 'Region', 'CIDR', 'Data CIDR', 'State', 'Shield', 'Outbound IPs', 'Generation', 'Created at'],
    )
  }
}
