'use strict'

const co = require('co')
const wait = require('co-wait')
const cli = require('heroku-cli-util')

module.exports = function * (context, heroku, domain) {
  yield cli.action(`Waiting for ${cli.color.green(domain.hostname)}`, co(function * () {
    while (domain.status === 'pending') {
      yield wait(5000)
      domain = yield heroku.get(`/apps/${context.app}/domains/${domain.id}`)
    }
    if (domain.status === 'succeeded' || domain.status === 'none') return
    throw new Error(`The domain creation finished with status ${domain.status}`)
  }))
}
