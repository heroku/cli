'use strict'

const co = require('co')
const debug = require('./debug')
const pgUtil = require('./util')
const getConfig = require('./config')
const cli = require('heroku-cli-util')

module.exports = heroku => {
  function * attachment (app, passedDb, namespace = null) {
    let db = passedDb || 'DATABASE_URL'

    function matchesHelper (app, db) {
      const {resolve} = require('heroku-cli-addons')

      debug(`fetching ${db} on ${app}`)

      return resolve.appAttachment(heroku, app, db, {addon_service: 'heroku-postgresql', namespace: namespace})
      .then(attached => ({matches: [attached]}))
      .catch(function (err) {
        if (err.statusCode === 422 && err.body && err.body.id === 'multiple_matches' && err.matches) {
          return {matches: err.matches, err: err}
        }

        if (err.statusCode === 404 && err.body && err.body.id === 'not_found') {
          return {matches: null, err: err}
        }

        throw err
      })
    }

    let {matches, err} = yield matchesHelper(app, db)

    // happy path where the resolver matches just one
    if (matches && matches.length === 1) {
      return matches[0]
    }

    // case for 404 where there are implicit attachments
    if (!matches) {
      let appConfigMatch = new RegExp('^(.+?)::(.+)').exec(db)
      if (appConfigMatch) {
        app = appConfigMatch[1]
        db = appConfigMatch[2]
      }

      if (!db.endsWith('_URL')) {
        db = db + '_URL'
      }

      let [config, attachments] = yield [
        getConfig(heroku, app),
        allAttachments(app)
      ]

      if (attachments.length === 0) {
        throw new Error(`${cli.color.app(app)} has no databases`)
      }

      matches = attachments.filter(attachment => config[db] && config[db] === config[pgUtil.getConfigVarName(attachment.config_vars)])

      if (matches.length === 0) {
        let validOptions = attachments.map(attachment => pgUtil.getConfigVarName(attachment.config_vars))
        throw new Error(`Unknown database: ${passedDb}. Valid options are: ${validOptions.join(', ')}`)
      }
    }

    // case for multiple attachments with passedDb
    let first = matches[0]

    // case for 422 where there are ambiguous attachments that are equivalent
    if (matches.every((match) => first.addon.id === match.addon.id && first.app.id === match.app.id)) {
      let config = yield getConfig(heroku, first.app.name)

      if (matches.every((match) => config[pgUtil.getConfigVarName(first.config_vars)] === config[pgUtil.getConfigVarName(match.config_vars)])) {
        return first
      }
    }

    throw err
  }

  function * addon (app, db) {
    return (yield attachment(app, db)).addon
  }

  function * database (app, db, namespace) {
    let attached = yield attachment(app, db, namespace)

    // would inline this as well but in some cases attachment pulls down config
    // as well and we would request twice at the same time but I did not want
    // to push this down into attachment because we do not always need config
    let config = yield getConfig(heroku, attached.app.name)
    return pgUtil.getConnectionDetails(attached, config)
  }

  function * allAttachments (app) {
    let attachments = yield heroku.get(`/apps/${app}/addon-attachments`, {
      headers: {'Accept-Inclusion': 'addon:plan,config_vars'}
    })
    return attachments.filter(a => a.addon.plan.name.startsWith('heroku-postgresql'))
  }

  function getAttachmentNamesByAddon (attachments) {
    return attachments.reduce((results, a) => {
      results[a.addon.id] = (results[a.addon.id] || []).concat(a.name)
      return results
    }, {})
  }

  function * all (app) {
    const uniqby = require('lodash.uniqby')

    debug(`fetching all DBs on ${app}`)

    let attachments = yield allAttachments(app)
    let addons = attachments.map(a => a.addon)

    // Get the list of attachment names per addon here and add to each addon obj
    let attachmentNamesByAddon = getAttachmentNamesByAddon(attachments)
    addons = uniqby(addons, 'id')
    addons.forEach(addon => {
      addon.attachment_names = attachmentNamesByAddon[addon.id]
    })

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

  function * release (appName, id) {
    return yield heroku.get(`/apps/${appName}/releases/${id}`)
  }

  return {
    addon: co.wrap(addon),
    attachment: co.wrap(attachment),
    all: co.wrap(all),
    database: co.wrap(database),
    arbitraryAppDB: co.wrap(arbitraryAppDB),
    release: co.wrap(release)
  }
}
