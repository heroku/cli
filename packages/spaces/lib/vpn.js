'use strict'

module.exports = function (heroku) {
  function postVPN (space, ip, cidrs) {
    return request('POST', `/spaces/${space}/vpn`, { public_ip: ip, routable_cidrs: cidrs })
  }

  function deleteVPN (space) {
    return request('DELETE', `/spaces/${space}/vpn`)
  }

  function getVPNInfo (space) {
    return request('GET', `/spaces/${space}/vpn`)
  }

  function getVPNConfig (space) {
    return request('GET', `/spaces/${space}/vpn/config`)
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
    postVPN,
    deleteVPN,
    getVPNInfo,
    getVPNConfig
  }
}
