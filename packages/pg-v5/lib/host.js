'use strict'

const util = require('./util')

module.exports = function (addon) {
  let host = process.env.HEROKU_DATA_HOST || process.env.HEROKU_POSTGRESQL_HOST

  if (host) return `https://${host}`
  return 'https://api.data.heroku.com'
}
