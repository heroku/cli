'use strict'

module.exports = function (addon) {
  let appHost = process.env.HEROKU_POSTGRESQL_HOST
  let plan = addon.plan.name

  if (plan.endsWith('dev') || plan.endsWith('basic')) {
    if (appHost) return `https://${appHost}.herokuapp.com`
    return 'https://postgres-starter-api.heroku.com'
  } else {
    if (appHost) return `https://${appHost}.herokuapp.com`
    return 'https://postgres-api.heroku.com'
  }
}
