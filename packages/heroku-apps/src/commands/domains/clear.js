'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  const bluebird = require('bluebird')
  yield cli.action(`Removing all domains from ${cli.color.app(context.app)}`, co(function * () {
    let domains = yield heroku.request({path: `/apps/${context.app}/domains`})
    domains = domains.filter((d) => d.kind === 'custom')
    if (domains.length === 0) return
    yield bluebird.map(
      domains,
      (domain) => heroku.request({path: `/apps/${context.app}/domains/${domain.hostname}`, method: 'DELETE'}),
      {concurrency: 5}
    )
  }))
}

module.exports = {
  topic: 'domains',
  command: 'clear',
  description: 'remove all domains from an app',
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
