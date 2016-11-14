'use strict'

const memoize = require('lodash.memoize')

const addonResolver = function (heroku, app, id, options = {}) {
  const headers = options.headers || {}
  let getAddon = function (id) {
    return heroku.get(`/addons/${encodeURIComponent(id)}`, {headers})
  }

  if (!app || id.indexOf('::') !== -1) return getAddon(id)
  return heroku.get(`/apps/${app}/addons/${encodeURIComponent(id)}`, {headers})
    .catch(function (err) { if (err.statusCode === 404) return getAddon(id); else throw err })
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

    result.then(function () {
      memoized.cache = cache.set(key, result) || cache
      return arguments
    })

    return result
  }
  memoized.cache = new memoize.Cache()
  return memoized
}

exports.addon = memoizePromise(addonResolver, (_, app, id) => `${app}|${id}`)

function NotFound () {
  Error.call(this)
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name

  this.statusCode = 404
  this.message = 'Couldn\'t find that addon.'
}

function AmbiguousError (objects) {
  Error.call(this)
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name

  this.statusCode = 422
  this.message = `Ambiguous identifier; multiple matching add-ons found: ${objects.map((object) => object.name).join(', ')}.`
  this.body = {'id': 'multiple_matches', 'message': this.message}
}

const singularize = function (matches) {
  switch (matches.length) {
    case 0:
      throw new NotFound()
    case 1:
      return matches[0]
    default:
      throw new AmbiguousError(matches)
  }
}

exports.attachment = function (heroku, app, id, options = {}) {
  const headers = options.headers || {}

  function getAttachment (id) {
    return heroku.get(`/addon-attachments/${encodeURIComponent(id)}`, {headers})
      .catch(function (err) { if (err.statusCode !== 404) throw err })
  }

  function getAppAttachment (app, id) {
    if (!app || id.indexOf('::') !== -1) return getAttachment(id)
    return heroku.get(`/apps/${app}/addon-attachments/${encodeURIComponent(id)}`, {headers})
      .catch(function (err) { if (err.statusCode !== 404) throw err })
  }

  function getAppAddonAttachment (addon, app) {
    return heroku.get(`/addons/${encodeURIComponent(addon.id)}/addon-attachments`, {headers})
      .then(function (attachments) {
        return singularize(attachments.filter((att) => att.app.name === app))
      })
  }

  // first check to see if there is an attachment matching this app/id combo
  return getAppAttachment(app, id)
    // if no attachment, look up an add-on that matches the id
    .then((attachment) => {
      if (attachment) return attachment
      // If we were passed an add-on slug, there still could be an attachment
      // to the context app. Try to find and use it so `context_app` is set
      // correctly in the SSO payload.
      else if (app) {
        return exports.addon(heroku, app, id)
        .then((addon) => getAppAddonAttachment(addon, app))
      } else {
        throw new NotFound()
      }
    })
}
