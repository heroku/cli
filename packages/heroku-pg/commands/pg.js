'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
let _ = require('lodash')
let url = require('url')
let host = require('../lib/host')

function databaseNameFromUrl (uri, config) {
  delete config.DATABASE_URL
  let name = _.invert(config)[uri]
  if (name) return name.replace(/_URL$/, '')
  uri = url.parse(uri)
  return `${uri.hostname}:${uri.port || 5432}${uri.path}`
}

function displayDB (db) {
  cli.styledHeader(cli.color.attachment(db.addon.name))
  let info = db.info.info.reduce((info, i) => {
    if (i.values.length > 0) {
      info[i.name] = i.resolve_db_name ? databaseNameFromUrl(i.values[0], db.config) : i.values.join(', ')
    }
    return info
  }, {})
  info['Config Vars'] = db.addon.config_vars.map((c) => cli.color.configVar(c)).join(', ')
  let keys = ['Config Vars'].concat(db.info.info.map((i) => i.name))
  cli.styledObject(info, keys)
  cli.log()
}

function * run (context, heroku) {
  let app = context.app
  let config = heroku.get(`/apps/${app}/config-vars`)
  let addons = yield heroku.request({
    method: 'get',
    path: `/apps/${app}/addons`
  })
  addons = addons.filter((a) => a.addon_service.name === 'heroku-postgresql')
  addons = _.sortBy(addons, 'config_vars[0]')

  let dbs = yield addons.map((a) => {
    return {
      addon: a,
      config,
      info: heroku.request({
        host: host(a),
        method: 'get',
        path: `/client/v11/databases/${a.name}`
      })
    }
  })

  if (addons.length === 0) {
    cli.log(`${cli.color.app(app)} has no heroku-postgresql databases.`)
  } else {
    dbs.forEach(displayDB)
  }
}

module.exports = {
  topic: 'pg',
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}

exports.displayDB = displayDB
