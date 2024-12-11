import {
  Space,
  Region,
  SpaceRegion,
  SpaceNat,
} from './fir'

export type SpaceExpanded = Omit<Space, 'region'> & {
  region: SpaceRegion & Partial<Region>
}

export type SpaceWithOutboundIps = SpaceExpanded & {
  outbound_ips?: SpaceNat
}
