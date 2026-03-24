import * as Heroku from '@heroku-cli/schema'
import * as color from '@heroku/heroku-cli-util/color'
import * as hux from '@heroku/heroku-cli-util/hux'
import {ux} from '@oclif/core/ux'

import {getGeneration} from '../apps/generation.js'
import {SpaceNat} from '../types/fir.js'
import {SpaceWithOutboundIps} from '../types/spaces.js'

export function displayNat(nat?: Required<SpaceNat>) {
  if (!nat) return
  if (nat.state !== 'enabled') return nat.state
  return nat.sources.join(', ')
}

export function displayShieldState(space: Heroku.Space) {
  return space.shield ? 'on' : 'off'
}

export function renderInfo(space: SpaceWithOutboundIps, json: boolean) {
  if (json) {
    ux.stdout(JSON.stringify(space, null, 2))
  } else {
    hux.styledHeader(color.space(space.name || ''))
    hux.styledObject(
      {
        CIDR: space.cidr,
        'Created at': space.created_at,
        'Data CIDR': space.data_cidr,
        Generation: getGeneration(space),
        ID: space.id,
        'Outbound IPs': displayNat(space.outbound_ips),
        Region: space.region?.description,
        Shield: displayShieldState(space),
        State: space.state,
        Team: space.team?.name,
      },
      ['ID', 'Team', 'Region', 'CIDR', 'Data CIDR', 'State', 'Shield', 'Outbound IPs', 'Generation', 'Created at'],
    )
  }
}
