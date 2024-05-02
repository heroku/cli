'use strict'
const cli = require('heroku-cli-util')

module.exports = function (heroku) {
  function postVPNConnections(space, name, ip, cidrs) {
    return request('POST', `/spaces/${space}/vpn-connections`, {
      name: name,
      public_ip: ip,
      routable_cidrs: cidrs,
    })
  }

  function patchVPNConnections(space, name, cidrs) {
    return request('PATCH', `/spaces/${space}/vpn-connections/${name}`, {
      routable_cidrs: cidrs,
    })
  }

  function getVPNConnections(space) {
    return request('GET', `/spaces/${space}/vpn-connections`)
  }

  function getVPNConnection(space, name) {
    return request('GET', `/spaces/${space}/vpn-connections/${name}`)
  }

  function deleteVPNConnection(space, name) {
    return request('DELETE', `/spaces/${space}/vpn-connections/${name}`)
  }

  function request(method, path, body) {
    return heroku.request({
      method: method,
      path: encodeURI(path),
      body: body,
    })
  }

  function displayVPNConfigInfo(space, name, config) {
    cli.styledHeader(`${name} VPN Tunnels`)
    config.tunnels.forEach((val, i) => {
      val.tunnel_id = 'Tunnel ' + (i + 1)
      val.routable_cidr = config.space_cidr_block
      val.ike_version = config.ike_version
    })

    cli.table(config.tunnels, {
      columns: [
        {key: 'tunnel_id', label: 'VPN Tunnel'},
        {key: 'customer_ip', label: 'Customer Gateway'},
        {key: 'ip', label: 'VPN Gateway'},
        {key: 'pre_shared_key', label: 'Pre-shared Key'},
        {key: 'routable_cidr', label: 'Routable Subnets'},
        {key: 'ike_version', label: 'IKE Version'},
      ],
    })
  }

  return {
    postVPNConnections,
    patchVPNConnections,
    getVPNConnections,
    getVPNConnection,
    deleteVPNConnection,
    displayVPNConfigInfo,
  }
}
