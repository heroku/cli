'use strict'

const debug = require('./debug')
const pgUtil = require('./util')
const getConfig = require('./config')
const cli = require('heroku-cli-util')
const bastion = require('./bastion')

module.exports = heroku => {
  async function attachment(app, passedDb, namespace = null) {
    let db = passedDb || 'DATABASE_URL'

    function matchesHelper(app, db) {
      const {resolve} = require('@heroku-cli/plugin-addons')

      debug(`fetching ${db} on ${app}`)

      let addonService = process.env.HEROKU_POSTGRESQL_ADDON_NAME || 'heroku-postgresql'
      debug(`addon service: ${addonService}`)
      return resolve.appAttachment(heroku, app, db, {addon_service: addonService, namespace: namespace})
        .then(attached => ({matches: [attached]}))
        .catch(function (error) {
          if (error.statusCode === 422 && error.body && error.body.id === 'multiple_matches' && error.matches) {
            return {matches: error.matches, err: error}
          }

          if (error.statusCode === 404 && error.body && error.body.id === 'not_found') {
            return {matches: null, err: error}
          }

          throw error
        })
    }

    let {matches, err} = await matchesHelper(app, db)

    // happy path where the resolver matches just one
    if (matches && matches.length === 1) {
      return matches[0]
    }

    // case for 404 where there are implicit attachments
    if (!matches) {
      // eslint-disable-next-line prefer-regex-literals
      let appConfigMatch = new RegExp('^(.+?)::(.+)').exec(db)
      if (appConfigMatch) {
        app = appConfigMatch[1]
        db = appConfigMatch[2]
      }

      if (!db.endsWith('_URL')) {
        db += '_URL'
      }

      let [config, attachments] = await Promise.all([
        getConfig(heroku, app),
        allAttachments(app),
      ])

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
    if (matches.every(match => first.addon.id === match.addon.id && first.app.id === match.app.id)) {
      let config = await getConfig(heroku, first.app.name)

      if (matches.every(match => config[pgUtil.getConfigVarName(first.config_vars)] === config[pgUtil.getConfigVarName(match.config_vars)])) {
        return first
      }
    }

    throw err
  }

  async function addon(app, db) {
    return ((await attachment(app, db))).addon
  }

  async function database(app, db, namespace) {
    let attached = await attachment(app, db, namespace)

    // would inline this as well but in some cases attachment pulls down config
    // as well and we would request twice at the same time but I did not want
    // to push this down into attachment because we do not always need config
    let config = await getConfig(heroku, attached.app.name)

    let database = pgUtil.getConnectionDetails(attached, config)
    if (pgUtil.bastionKeyPlan(attached.addon) && !database.bastionKey) {
      let bastionConfig = await bastion.fetchConfig(heroku, attached.addon)
      let bastionHost = bastionConfig.host
      let bastionKey = bastionConfig.private_key

      Object.assign(database, {bastionHost, bastionKey})
    }

    return database
  }

  async function allAttachments(app) {
    let attachments = await heroku.get(`/apps/${app}/addon-attachments`, {
      headers: {'Accept-Inclusion': 'addon:plan,config_vars'},
    })
    return attachments.filter(a => a.addon.plan.name.startsWith('heroku-postgresql'))
  }

  function getAttachmentNamesByAddon(attachments) {
    return attachments.reduce((results, a) => {
      results[a.addon.id] = (results[a.addon.id] || []).concat(a.name)
      return results
    }, {})
  }

  async function all(app) {
    const {uniqBy} = require('lodash')

    debug(`fetching all DBs on ${app}`)

    let attachments = await allAttachments(app)
    let addons = attachments.map(a => a.addon)

    // Get the list of attachment names per addon here and add to each addon obj
    let attachmentNamesByAddon = getAttachmentNamesByAddon(attachments)
    addons = uniqBy(addons, 'id')
    addons.forEach(addon => {
      addon.attachment_names = attachmentNamesByAddon[addon.id]
    })

    return addons
  }

  async function arbitraryAppDB(app) {
    // Since Postgres backups are tied to the app and not the add-on, but
    // we require *an* add-on to interact with, make sure that that add-on
    // is attached to the right app.

    debug(`fetching arbitrary app db on ${app}`)
    let addons = await heroku.get(`/apps/${app}/addons`)
    let addon = addons.find(a => a.app.name === app && a.plan.name.startsWith('heroku-postgresql'))
    if (!addon) throw new Error(`No heroku-postgresql databases on ${app}`)
    return addon
  }

  async function release(appName, id) {
    return await heroku.get(`/apps/${appName}/releases/${id}`)
  }

  return {
    addon: addon,
    attachment: attachment,
    all: all,
    database: database,
    arbitraryAppDB: arbitraryAppDB,
    release: release,
  }
}
