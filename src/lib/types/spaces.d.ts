import type {InboundRuleset} from '@heroku/types/3.sdk'
import {
  Space,
  Region,
  SpaceRegion,
  SpaceNat,
} from './fir'

export type SpaceExpanded = Omit<Space, 'region'> & {
  region: SpaceRegion & Partial<Region>
}

// The applied field is optional for backward compatibility with API versions that don't include it yet.
// Once the API always includes the applied field, this will be added directly to @heroku/types.
export type ExtendedInboundRuleset = InboundRuleset & {
  applied?: boolean
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
