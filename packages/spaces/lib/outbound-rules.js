'use strict'

let cli = require('heroku-cli-util')

module.exports = function (heroku) {
  function getOutboundRules (space) {
    return heroku.request({
      path: `/spaces/${space}/outbound-ruleset`,
      headers: { Accept: 'application/vnd.heroku+json; version=3.dogwood' }
    })
  }

  function putOutboundRules (space, ruleset) {
    return heroku.request({
      method: 'PUT',
      path: `/spaces/${space}/outbound-ruleset`,
      body: ruleset,
      headers: { Accept: 'application/vnd.heroku+json; version=3.dogwood' }
    })
  }

  function displayRules (space, ruleset) {
    if (ruleset.rules.length > 0) {
      cli.styledHeader('Outbound Rules')
      display(ruleset.rules)
    } else {
      cli.styledHeader(`${space} has no Outbound Rules. Your Dynos cannot communicate with hosts outside of ${space}.`)
    }
  }

  function lined (rules) {
    var lined = []
    for (var i = 0, len = rules.length; i < len; i++) {
      lined.push({
        line: i + 1,
        target: rules[i].target,
        from_port: rules[i].from_port,
        to_port: rules[i].to_port,
        protocol: rules[i].protocol
      })
    }

    return lined
  }

  function display (rules) {
    var f = function (p) {
      var n = p
      return n.toString()
    }

    cli.table(lined(rules), {
      columns: [
        { key: 'line', label: 'Rule Number' },
        { key: 'target', label: 'Destination' },
        { key: 'from_port', label: 'From Port', format: fromPort => f(fromPort) },
        { key: 'to_port', label: 'To Port', format: toPort => f(toPort) },
        { key: 'protocol', label: 'Protocol' }
      ]
    })
  }

  function parsePorts (proto, p) {
    if (p === '-1' || p === 'any') {
      if (proto === 'icmp') {
        return [0, 255]
      } else {
        return [0, 65535]
      }
    }

    var actual = []
    if (p != null) {
      var ports = p.split('-')
      if (ports.length === 2) {
        actual = [ports[0] | 0, ports[1] | 0]
      } else if (ports.length === 1) {
        actual = [ports[0] | 0, ports[0] | 0]
      } else {
        throw new Error('Specified --port range seems incorrect.')
      }
    }

    if (actual.length !== 2) {
      throw new Error('Specified --port range seems incorrect.')
    }

    return actual
  }

  return {
    getOutboundRules,
    putOutboundRules,
    displayRules,
    parsePorts
  }
}
