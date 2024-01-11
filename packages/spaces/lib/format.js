'use strict'

const cli = require('heroku-cli-util')

module.exports = function () {
  function CIDR(cidr) {
    if (!cidr || cidr.length === 0) return ''
    return cidr.join(', ')
  }

  function CIDRBlocksOrCIDRBlock(cidrBlocks, row) {
    if (!cidrBlocks || cidrBlocks.length === 0) return row.cidr_block
    // eslint-disable-next-line new-cap
    return CIDR(cidrBlocks)
  }

  function VPNStatus(s) {
    switch (s) {
    case 'UP':
    case 'available':
      return `${cli.color.green(s)}`
    case 'pending':
    case 'provisioning':
    case 'deprovisioning':
      return `${cli.color.yellow(s)}`
    case 'DOWN':
    case 'deleting':
    case 'deleted':
      return `${cli.color.red(s)}`
    default:
      return s
    }
  }

  function PeeringStatus(s) {
    switch (s) {
    case 'active':
      return `${cli.color.green(s)}`
    case 'pending-acceptance':
    case 'provisioning':
      return `${cli.color.yellow(s)}`
    case 'expired':
    case 'failed':
    case 'deleted':
    case 'rejected':
      return `${cli.color.red(s)}`
    default:
      return s
    }
  }

  function HostStatus(s) {
    switch (s) {
    case 'available':
      return `${cli.color.green(s)}`
    case 'under-assessment':
      return `${cli.color.yellow(s)}`
    case 'permanent-failure':
    case 'released-permanent-failure':
      return `${cli.color.red(s)}`
    case 'released':
      return `${cli.color.gray(s)}`
    default:
      return s
    }
  }

  function Percent(v) {
    const fmt = () => `${v}%`

    switch (typeof v) {
    case 'number':
    case 'bigint':
      return fmt()
    case 'string':
      return v.length > 0 ? fmt() : v
    default:
      return v
    }
  }

  return {
    CIDR,
    CIDRBlocksOrCIDRBlock,
    PeeringStatus,
    VPNStatus,
    HostStatus,
    Percent,
  }
}
