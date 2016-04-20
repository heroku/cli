'use strict'

module.exports = function (attachment) {
  let shogun = process.env.SHOGUN
  let appHost = process.env.HEROKU_POSTGRESQL_HOST
  if (attachment.plan.name.match(/dev|basic/)) {
    if (appHost) return `https://${appHost}.herokuapp.com`
    return 'https://postgres-starter-api.heroku.com'
  } else {
    if (shogun) return `https://${shogun}.herokuapp.com`
    if (appHost) return `https://${appHost}.herokuapp.com`
    return 'https://postgres-api.heroku.com'
  }
}
