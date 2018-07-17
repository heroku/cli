'use strict'

module.exports = function (heroku) {
  function postVPNConnections (space, name, ip, cidrs) {
    return request('POST', `/spaces/${space}/vpn-connections`, {
      name: name,
      public_ip: ip,
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
    let lib = require('../lib/vpn')(heroku)

    if (!name) {
      return lib.deleteVPN(space)
    }

    return request('DELETE', `/spaces/${space}/vpn-connections/${name}`)
  }

  function request (method, path, body) {
    return heroku.request({
      method: method,
      path: path,
      body: body
    })
  }

  return {
    postVPNConnections,
    getVPNConnections,
    getVPNConnection,
    deleteVPNConnection
  }
}
