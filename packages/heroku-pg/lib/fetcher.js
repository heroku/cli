'use strict'

const co = require('co')
const debug = require('./debug')
const pgUtil = require('./util')

module.exports = heroku => {
  function * attachment (app, db) {
    const {resolve} = require('heroku-cli-addons')

    db = db || 'DATABASE_URL'
    debug(`fetching ${db} on ${app}`)
    return yield resolve.attachment(heroku, app, db)
  }

  function * addon (app, db) {
    return (yield attachment(app, db)).addon
  }

  function * database (app, db) {
    let [attached, config] = yield [
      attachment(app, db),
      heroku.get(`/apps/${app}/config-vars`)
    ]
    return pgUtil.getConnectionDetails(attached, config)
  }

  function * all (app) {
    const uniqby = require('lodash.uniqby')

    debug(`fetching all DBs on ${app}`)

    let attachments = yield heroku.get(`/apps/${app}/addon-attachments`, {
      headers: {'Accept-Inclusion': 'addon:plan'}
    })
    let addons = attachments.map(a => a.addon)
    addons = addons.filter(a => a.plan.name.startsWith('heroku-postgresql'))
    addons = uniqby(addons, 'id')

    return addons
  }

  function * arbitraryAppDB (app) {
    // Since Postgres backups are tied to the app and not the add-on, but
    // we require *an* add-on to interact with, make sure that that add-on
    // is attached to the right app.

    debug(`fetching arbitrary app db on ${app}`)
    let addons = yield heroku.get(`/apps/${app}/addons`)
    let addon = addons.find(a => a.app.name === app && a.plan.name.startsWith('heroku-postgresql'))
    if (!addon) throw new Error(`No heroku-postgresql databases on ${app}`)
    return addon
  }

  return {
    addon: co.wrap(addon),
    all: co.wrap(all),
    database: co.wrap(database),
    arbitraryAppDB: co.wrap(arbitraryAppDB)
  }
}
