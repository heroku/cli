'use strict'

const cli = require('heroku-cli-util')
const format = require('./format')()

module.exports = function (heroku) {
  function getPeeringInfo (space) {
    return request('GET', `/spaces/${space}/peering-info`)
  }

  function getPeerings (space) {
    return request('GET', `/spaces/${space}/peerings`)
  }

  function acceptPeeringRequest (space, pcxID) {
    return request('POST', `/spaces/${space}/peerings`, { pcx_id: pcxID })
  }

  function destroyPeeringRequest (space, pcxID) {
    return request('DELETE', `/spaces/${space}/peerings/${pcxID}`)
  }

  function displayPeeringInfo (space, info) {
    cli.styledHeader(`${space} Peering Info`)
    cli.styledObject({
      'AWS Account ID': info.aws_account_id,
      'AWS Region': info.aws_region,
      'AWS VPC ID': info.vpc_id,
      'AWS VPC CIDR': info.vpc_cidr,
      'Space CIDRs': format.CIDR(info.space_cidr_blocks),
      'Unavailable CIDRs': format.CIDR(info.unavailable_cidr_blocks)
    }, ['AWS Account ID', 'AWS Region', 'AWS VPC ID', 'AWS VPC CIDR', 'Space CIDRs', 'Unavailable CIDRs'])
  }

  function displayPeers (space, peers) {
    cli.styledHeader(`${space} Peerings`)
    cli.table(peers, {
      columns: [
        { key: 'pcx_id', label: 'PCX ID' },
        { key: 'type', label: 'Type' },
        { key: 'cidr_blocks', label: 'CIDR Blocks', format: format.CIDRBlocksOrCIDRBlock },
        { key: 'status', label: 'Status', format: format.PeeringStatus },
        { key: 'aws_vpc_id', label: 'VPC ID' },
        { key: 'aws_region', label: 'AWS Region' },
        { key: 'aws_account_id', label: 'AWS Account ID' },
        { key: 'expires', label: 'Expires' }
      ]
    })
  }

  function request (method, path, body) {
    return heroku.request({
      method: method,
      path: path,
      body: body,
      headers: { Accept: 'application/vnd.heroku+json; version=3.dogwood' }
    })
  }

  return {
    getPeeringInfo,
    displayPeeringInfo,
    displayPeers,
    getPeerings,
    acceptPeeringRequest,
    destroyPeeringRequest
  }
}
