'use strict'

const _ = require('lodash')

const addonHeaders = function () {
  return {
    'Accept': 'application/vnd.heroku+json; version=3.actions',
    'Accept-Expansion': 'addon_service,plan'
  }
}

const attachmentHeaders = function () {
  return {
    'Accept': 'application/vnd.heroku+json; version=3.actions',
    'Accept-Inclusion': 'addon:plan,config_vars'
  }
}

const appAddon = function (heroku, app, id, options = {}) {
  const headers = addonHeaders()
  return heroku.post('/actions/addons/resolve', {
    'headers': headers,
    'body': {'app': app, 'addon': id, 'addon_service': options.addon_service}
  })
    .then(singularize('addon', options.namespace))
}

const handleNotFound = function (err, resource) {
  if (err.statusCode === 404 && err.body && err.body.resource === resource) {
    return true
  } else {
    throw err
  }
}

exports.appAddon = appAddon

const addonResolver = function (heroku, app, id, options = {}) {
  const headers = addonHeaders()

  let getAddon = function (id) {
    return heroku.post('/actions/addons/resolve', {
      'headers': headers,
      'body': {'app': null, 'addon': id, 'addon_service': options.addon_service}
    })
      .then(singularize('addon', options.namespace))
  }

  if (!app || id.includes('::')) return getAddon(id)

  return appAddon(heroku, app, id, options)
    .catch(function (err) { if (handleNotFound(err, 'add_on')) return getAddon(id) })
}

/**
 * Replacing memoize with our own memoization function that works with promises
 * https://github.com/lodash/lodash/blob/da329eb776a15825c04ffea9fa75ae941ea524af/lodash.js#L10534
 */
const memoizePromise = function (func, resolver) {
  var memoized = function () {
    const args = arguments
    const key = resolver.apply(this, args)
    const cache = memoized.cache

    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = func.apply(this, args)

    return result.then(function () {
      memoized.cache = cache.set(key, result) || cache
      return result
    })
  }
  memoized.cache = new _.memoize.Cache()
  return memoized
}

exports.addon = memoizePromise(addonResolver, (_, app, id, options = {}) => `${app}|${id}|${options.addon_service}`)

function NotFound () {
  Error.call(this)
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name

  this.statusCode = 404
  this.message = 'Couldn\'t find that addon.'
}

function AmbiguousError (matches, type) {
  Error.call(this)
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name

  this.statusCode = 422
  this.message = `Ambiguous identifier; multiple matching add-ons found: ${matches.map((match) => match.name).join(', ')}.`
  this.body = {'id': 'multiple_matches', 'message': this.message}
  this.matches = matches
  this.type = type
}

const singularize = function (type, namespace) {
  return (matches) => {
    if (namespace) {
      matches = matches.filter(m => m.namespace === namespace)
    } else if (matches.length > 1) {
      // In cases that aren't specific enough, filter by namespace
      matches = matches.filter(m => !m.hasOwnProperty('namespace') || m.namespace === null)
    }
    switch (matches.length) {
      case 0:
        throw new NotFound()
      case 1:
        return matches[0]
      default:
        throw new AmbiguousError(matches, type)
    }
  }
}
exports.attachment = function (heroku, app, id, options = {}) {
  const headers = attachmentHeaders()

  function getAttachment (id) {
    return heroku.post('/actions/addon-attachments/resolve', {
      'headers': headers, 'body': {'app': null, 'addon_attachment': id, 'addon_service': options.addon_service}
    }).then(singularize('addon_attachment', options.namespace))
      .catch(function (err) { handleNotFound(err, 'add_on attachment') })
  }

  function getAppAddonAttachment (addon, app) {
    return heroku.get(`/addons/${encodeURIComponent(addon.id)}/addon-attachments`, {headers})
      .then(filter(app, options.addon_service))
      .then(singularize('addon_attachment', options.namespace))
  }

  let promise
  if (!app || id.includes('::')) {
    promise = getAttachment(id)
  } else {
    promise = appAttachment(heroku, app, id, options)
      .catch(function (err) { handleNotFound(err, 'add_on attachment') })
  }

  // first check to see if there is an attachment matching this app/id combo
  return promise
    .then(function (attachment) {
      return {attachment}
    })
    .catch(function (error) {
      return {error}
    })
    // if no attachment, look up an add-on that matches the id
    .then((attachOrError) => {
      let {attachment, error} = attachOrError

      if (attachment) return attachment

      // If we were passed an add-on slug, there still could be an attachment
      // to the context app. Try to find and use it so `context_app` is set
      // correctly in the SSO payload.
      else if (app) {
        return exports.addon(heroku, app, id, options)
          .then((addon) => getAppAddonAttachment(addon, app))
          .catch((addonError) => {
            if (error) throw error
            throw addonError
          })
      } else {
        if (error) throw error
        throw new NotFound()
      }
    })
}

const appAttachment = function (heroku, app, id, options = {}) {
  const headers = attachmentHeaders()
  return heroku.post('/actions/addon-attachments/resolve', {
    'headers': headers, 'body': {'app': app, 'addon_attachment': id, 'addon_service': options.addon_service}
  }).then(singularize('addon_attachment', options.namespace))
}

exports.appAttachment = appAttachment

const filter = function (app, addonService) {
  return attachments => {
    return attachments.filter(attachment => {
      if (attachment.app.name !== app) {
        return false
      }

      if (addonService && attachment.addon_service.name !== addonService) {
        return false
      }

      return true
    })
  }
}
