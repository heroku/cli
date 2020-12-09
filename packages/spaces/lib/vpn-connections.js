'use strict'

module.exports = function (heroku) {
  function postVPNConnections (space, name, ip, cidrs) {
    return request('POST', `/spaces/${space}/vpn-connections`, {
      name: name,
      public_ip: ip,
      routable_cidrs: cidrs
    })
  }

  function patchVPNConnections (space, name, cidrs) {
    return request('PATCH', `/spaces/${space}/vpn-connections/${name}`, {
      routable_cidrs: cidrs
    })
  }

  function getVPNConnections (space) {
    return request('GET', `/spaces/${space}/vpn-connections`)
  }

  function getVPNConnection (space, name) {
    return request('GET', `/spaces/${space}/vpn-connections/${name}`)
  }

  function deleteVPNConnection (space, name) {
    return request('DELETE', `/spaces/${space}/vpn-connections/${name}`)
  }

  function request (method, path, body) {
    return heroku.request({
      method: method,
      path: encodeURI(path),
      body: body
    })
  }

  return {
    postVPNConnections,
    patchVPNConnections,
    getVPNConnections,
    getVPNConnection,
    deleteVPNConnection
  }
}
