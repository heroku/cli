'use strict'

const util = require('./util')

module.exports = function () {
  let host = process.env.HEROKU_POSTGRESQL_HOST

  if (host) return `https://${host}`
  return 'https://postgres-api.heroku.com'
}
