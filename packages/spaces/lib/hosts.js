'use strict'

const cli = require('heroku-cli-util')
const format = require('./format')()

module.exports = function (heroku) {
  function getHosts(space) {
    return request('GET', `/spaces/${space}/hosts`)
  }

  function displayHosts(space, hosts) {
    cli.styledHeader(`${space} Hosts`)
    cli.table(hosts, {
      columns: [
        {key: 'host_id', label: 'Host ID'},
        {key: 'state', label: 'State', format: format.HostStatus},
        {key: 'available_capacity_percentage', label: 'Available Capacity', format: format.Percent},
        {key: 'allocated_at', label: 'Allocated At'},
        {key: 'released_at', label: 'Released At'},
      ],
    })
  }

  function request(method, path, body) {
    return heroku.request({
      method: method,
      path: path,
      body: body,
      headers: {Accept: 'application/vnd.heroku+json; version=3.dogwood'},
    })
  }

  return {
    getHosts,
    displayHosts,
  }
}
