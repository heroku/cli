'use strict'

const util = require('./util')
const debug = require("./debug");

module.exports = function (addon) {
  let host = process.env.HEROKU_POSTGRESQL_HOST
  let essentialHost = process.env.HEROKU_POSTGRESQL_ESSENTIAL_HOST

  if (addon && util.essentialPlan(addon)) {
    if (essentialHost) return `https://${essentialHost}`
    debug(`============== host https://postgres-starter-api.heroku.com`)
    return 'https://postgres-starter-api.heroku.com'
  }
  if (host) return `https://${host}`
  debug(`============== host https://postgres-api.heroku.com`)
  return 'https://postgres-api.heroku.com'
}
