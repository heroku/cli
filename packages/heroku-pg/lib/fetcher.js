'use strict'

const co = require('co')
const debug = require('./debug')

module.exports = heroku => {
  function * addon (app, db) {
    const {resolve} = require('heroku-cli-addons')

    db = db || 'DATABASE_URL'
    debug(`fetching ${db} on ${app}`)
    let attachment = yield resolve.attachment(heroku, app, db, {'Accept-Inclusion': 'addon:plan'})
    return attachment.addon
  }

  function * database (app, db) {
    const url = require('url')

    let addonID = (yield module.exports(heroku).addon(app, db)).id
    let [addon, config] = yield [
      heroku.get(`/addons/${addonID}`),
      heroku.get(`/apps/${app}/config-vars`)
    ]

    db = url.parse(config[addon.config_vars[0]])
    let [user, password] = db.auth.split(':')
    return {
      user,
      password,
      database: db.path.split('/', 2)[1],
      host: db.hostname,
      port: db.port
    }
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

  return {
    addon: co.wrap(addon),
    all: co.wrap(all),
    database: co.wrap(database)
  }
}
