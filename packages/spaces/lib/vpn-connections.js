'use strict'

module.exports = function (heroku) {
  function postVPNConnections (space, name, ip, cidrs) {
    return request('POST', `/spaces/${space}/vpn-connections`, {
      name: name,
      public_ip: ip,
      routable_cidrs: cidrs
    })
  }

  function request (method, path, body) {
    return heroku.request({
      method: method,
      path: path,
      body: body
    })
  }

  return {
    postVPNConnections
  }
}
