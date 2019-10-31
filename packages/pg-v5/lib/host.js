'use strict'

const util = require('./util')

module.exports = function (addon) {
  let host = process.env.HEROKU_POSTGRESQL_HOST
  let starterHost = process.env.HEROKU_POSTGRESQL_STARTER_HOST

  if (addon && util.starterPlan(addon)) {
    if (starterHost) return `https://${starterHost}`
    return 'https://postgres-starter-api.heroku.com'
  }
  if (host) return `https://${host}`
  return 'https://postgres-api.heroku.com'
}
