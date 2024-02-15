'use strict'

const _ = require('lodash')

const addonHeaders = function () {
  return {
    Accept: 'application/vnd.heroku+json; version=3.actions',
    'Accept-Expansion': 'addon_service,plan',
  }
}

const appAddon = function (heroku, app, id, options = {}) {
  const headers = addonHeaders()
  return heroku.post('/actions/addons/resolve', {
    headers: headers,
    body: {app: app, addon: id, addon_service: options.addon_service},
  })
    .then(singularize('addon', options.namespace))
}

const handleNotFound = function (err, resource) {
  if (err.statusCode === 404 && err.body && err.body.resource === resource) {
    return true
  }

  throw err
}

exports.appAddon = appAddon

const addonResolver = function (heroku, app, id, options = {}) {
  const headers = addonHeaders()

  let getAddon = function (id) {
    return heroku.post('/actions/addons/resolve', {
      headers: headers,
      body: {app: null, addon: id, addon_service: options.addon_service},
    })
      .then(singularize('addon', options.namespace))
  }

  if (!app || id.includes('::')) return getAddon(id)

  return appAddon(heroku, app, id, options)
    .catch(function (error) {
      if (handleNotFound(error, 'add_on')) return getAddon(id)
    })
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

function NotFound() {
  Error.call(this)
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name

  this.statusCode = 404
  this.message = 'Couldn\'t find that addon.'
}

function AmbiguousError(matches, type) {
  Error.call(this)
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name

  this.statusCode = 422
  this.message = `Ambiguous identifier; multiple matching add-ons found: ${matches.map(match => match.name).join(', ')}.`
  this.body = {id: 'multiple_matches', message: this.message}
  this.matches = matches
  this.type = type
}

const singularize = function (type, namespace) {
  return matches => {
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
