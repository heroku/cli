'use strict'

const util = require('./util')

module.exports = function (addon) {
  let host = process.env.HEROKU_POSTGRESQL_HOST

  if (host) return `https://${host}`
  if (addon && util.starterPlan(addon)) return 'https://postgres-starter-api.heroku.com'
  return 'https://postgres-api.heroku.com'
}
