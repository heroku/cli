'use strict'

const co = require('co')
const cli = require('heroku-cli-util')
const util = require('../lib/util')

function displayDB (db, app) {
  if (db.addon.attachment_names) {
    cli.styledHeader(db.addon.attachment_names.map(c => cli.color.configVar(c + '_URL')).join(', '))
  } else {
    cli.styledHeader(db.configVars.map(c => cli.color.configVar(c)).join(', '))
  }

  if (db.addon.app.name !== app) {
    db.db.info.push({name: 'Billing App', values: [cli.color.cyan(db.addon.app.name)]})
  }
  db.db.info.push({name: 'Add-on', values: [cli.color.addon(db.addon.name)]})

  let info = db.db.info.reduce((info, i) => {
    if (i.values.length > 0) {
      if (i.resolve_db_name) {
        info[i.name] = i.values.map(v => util.databaseNameFromUrl(v, db.config))
      } else {
        info[i.name] = i.values
      }
      info[i.name] = info[i.name].join(', ')
    }
    return info
  }, {})
  let keys = db.db.info.map(i => i.name)
  cli.styledObject(info, keys)
  cli.log()
}

function * run (context, heroku) {
  const sortBy = require('lodash.sortby')
  const host = require('../lib/host')
  const fetcher = require('../lib/fetcher')(heroku)
  const app = context.app
  const db = context.args.database

  let addons = []
  let config = heroku.get(`/apps/${app}/config-vars`)

  if (db) {
    addons = yield [fetcher.addon(app, db)]
  } else {
    addons = yield fetcher.all(app)
    if (addons.length === 0) {
      cli.log(`${cli.color.app(app)} has no heroku-postgresql databases.`)
      return
    }
  }

  let dbs = yield addons.map(addon => {
    return {
      addon,
      config,
      db: heroku.request({
        host: host(addon),
        method: 'get',
        path: `/client/v11/databases/${addon.id}`
      }).catch(err => {
        if (err.statusCode !== 404) throw err
        cli.warn(`${cli.color.addon(addon.name)} is not yet provisioned.\nRun ${cli.color.cmd('heroku addons:wait')} to wait until the db is provisioned.`)
      })
    }
  })

  dbs = dbs.filter(db => db.db)
  dbs.forEach(db => { db.configVars = util.configVarNamesFromValue(db.config, db.db.resource_url) })
  dbs = sortBy(dbs, db => db.configVars[0] !== 'DATABASE_URL', 'configVars[0]')

  dbs.forEach(db => displayDB(db, app))
}

let cmd = {
  topic: 'pg',
  description: 'show database information',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  run: cli.command({preauth: true}, co.wrap(run))
}

module.exports = [
  cmd,
  Object.assign({command: 'info'}, cmd)
]
