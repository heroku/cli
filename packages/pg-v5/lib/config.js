'use strict'

const memoizePromise = require('./memoize_promise')

function config(heroku, app) {
  return heroku.get(`/apps/${app}/config-vars`)
}

module.exports = memoizePromise(config, (_heroku, app) => app)
