import {ux} from '@oclif/core'
import {displayCIDR} from './format'
import {PeeringInfo} from '@heroku-cli/schema'

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
