'use strict'

module.exports = function (addon) {
  let host = process.env.HEROKU_POSTGRESQL_HOST
  let plan = addon.plan.name

  if (plan.endsWith('dev') || plan.endsWith('basic')) {
    if (host) return `https://${host}`
    return 'https://postgres-starter-api.heroku.com'
  } else {
    if (host) return `https://${host}`
    return 'https://postgres-api.heroku.com'
  }
}
