'use strict'

let cli = require('heroku-cli-util')

module.exports = function (heroku) {
  function getRules(space) {
    return heroku.request({
      path: `/spaces/${space}/inbound-ruleset`,
      headers: {Accept: 'application/vnd.heroku+json; version=3.dogwood'},
    })
  }

  function putRules(space, ruleset) {
    return heroku.request({
      method: 'PUT',
      path: `/spaces/${space}/inbound-ruleset`,
      body: ruleset,
      headers: {Accept: 'application/vnd.heroku+json; version=3.dogwood'},
    })
  }

  function displayRules(space, ruleset) {
    if (ruleset.rules.length > 0) {
      cli.styledHeader('Trusted IP Ranges')
      for (let rule of ruleset.rules) cli.log(rule.source)
    } else {
      cli.styledHeader(`${space} has no trusted IP ranges. All inbound web requests to dynos are blocked.`)
    }
  }

  return {
    getRules,
    putRules,
    displayRules,
  }
}
