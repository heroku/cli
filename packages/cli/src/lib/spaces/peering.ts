import {ux} from '@oclif/core'
import {displayCIDR, peeringStatus} from './format'
import {Peering, PeeringInfo} from '@heroku-cli/schema'

export function displayPeeringInfo(space: string, info: PeeringInfo) {
  ux.styledHeader(`${space} Peering Info`)
  ux.styledObject({
    'AWS Account ID': info.aws_account_id,
    'AWS Region': info.aws_region,
    'AWS VPC ID': info.vpc_id,
    'AWS VPC CIDR': info.vpc_cidr,
    'Space CIDRs': displayCIDR(info.space_cidr_blocks),
    'Unavailable CIDRs': displayCIDR(info.unavailable_cidr_blocks),
  }, ['AWS Account ID', 'AWS Region', 'AWS VPC ID', 'AWS VPC CIDR', 'Space CIDRs', 'Unavailable CIDRs'])
}

export function displayPeeringsAsJSON(peerings: Peering[]) {
  ux.log(JSON.stringify(peerings, null, 2))
}

export function displayPeerings(space: string, peerings: Peering[]) {
  ux.styledHeader(`${space} Peerings`)
  ux.table(peerings, {
    pcx_id: {
      header: 'PCX ID',
    },
    type: {
      header: 'Type',
    },
    cidr_blocks: {
      header: 'CIDR Blocks',
      get: (row: any) => displayCIDR(row.cidr_blocks),
    },
    status: {
      header: 'Status',
      get: (row: any) => peeringStatus(row.status),
    },
    aws_vpc_id: {
      header: 'VPC ID',
    },
    aws_region: {
      header: 'AWS Region',
    },
    aws_account_id: {
      header: 'AWS Account ID',
    },
    expires: {
      header: 'Expires',
    },
  })
}
