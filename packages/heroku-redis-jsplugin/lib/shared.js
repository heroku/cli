'use strict'
let Heroku = require('heroku-client')
let cli = require('heroku-cli-util')

const HOST = process.env.HEROKU_REDIS_HOST || 'redis-api.heroku.com'
const ADDON = process.env.HEROKU_REDIS_ADDON_NAME || 'heroku-redis'

function request (context, path, method, body) {
  let headers = { 'Accept': 'application/json' }
  if (process.env.HEROKU_HEADERS) {
    Object.assign(headers, JSON.parse(process.env.HEROKU_HEADERS))
  }
  return Heroku.request({
    method: method || 'GET',
    path: path,
    host: HOST,
    auth: `${context.auth.username}:${context.auth.password}`,
    headers: headers,
    body: body
  })
}

function make_addons_filter (filter) {
  if (filter) {
    filter = filter.toUpperCase()
  }

  function matches (addon) {
    for (let i = 0; i < addon.config_vars.length; i++) {
      let cfg_name = addon.config_vars[i].toUpperCase()
      if (cfg_name.indexOf(filter) >= 0) {
        return true
      }
    }
    if (addon.name.toUpperCase().indexOf(filter) >= 0) {
      return true
    }
    return false
  }

  function on_response (addons) {
    let redis_addons = []
    for (let i = 0; i < addons.length; i++) {
      let addon = addons[i]
      let service = addon.addon_service.name

      if (service.indexOf(ADDON) === 0 && (!filter || matches(addon))) {
        redis_addons.push(addon)
      }
    }
    return redis_addons
  }

  return on_response
}

function * getRedisAddon (context, heroku, addonsList) {
  addonsList = addonsList || heroku.get(`/apps/${context.app}/addons`)

  let addonsFilter = make_addons_filter(context.args.database)
  let addons = addonsFilter(yield addonsList)

  if (addons.length === 0) {
    cli.exit(1, 'No Redis instances found.')
  } else if (addons.length > 1) {
    let names = addons.map(function (addon) { return addon.name })
    cli.exit(1, `Please specify a single instance. Found: ${names.join(', ')}`)
  }

  return addons[0]
}

function * info (context, heroku) {
  let addons = yield heroku.get(`/apps/${context.app}/addons`)
  // filter out non-redis addons
  addons = make_addons_filter(context.args.database)(addons)
  // get info for each db
  let databases = yield addons.map(function * (addon) {
    return yield {
      addon: addon,
      redis: request(context, `/redis/v0/databases/${addon.name}`).catch(function (err) {
        if (err.statusCode !== 404) {
          throw (err)
        }
        return null
      })
    }
  })

  // print out the info of the addon and redis db info
  for (let db of databases) {
    if (db.redis === null) {
      continue
    }

    cli.styledHeader(`${db.addon.name} (${db.addon.config_vars.join(', ')})`)
    cli.styledHash(db.redis.info.reduce(function (memo, row) {
      memo[row.name] = row.values
      return memo
    }, {}), db.redis.info.map(function (row) { return row.name }))
  }
}

module.exports = {
  request: request,
  make_addons_filter: make_addons_filter,
  getRedisAddon: getRedisAddon,
  info: info
}
