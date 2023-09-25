'use strict'

const util = require('./util')

module.exports = function (addon) {
  let host = process.env.HEROKU_DATA_HOST || process.env.HEROKU_POSTGRESQL_HOST
  let essentialHost = process.env.HEROKU_POSTGRESQL_ESSENTIAL_HOST

  if (addon && util.essentialPlan(addon)) {
    if (essentialHost) return `https://${essentialHost}`
    return 'https://postgres-starter-api.heroku.com'
  }

  if (host) return `https://${host}`
  return 'https://postgres-api.heroku.com'
}
