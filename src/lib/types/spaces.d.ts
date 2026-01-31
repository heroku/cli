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

export type SpaceTopology = {
  version: number,
  apps: Array<{
    id?: string
    domains: string[]
    formations: Array<{
      process_type: string
      dynos: Array<{
        number: number
        private_ip: string
        hostname: string
      }>
    }>
  }>
}
