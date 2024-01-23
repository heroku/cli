import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {HTTPError} from 'http-call'
import * as _ from 'lodash'

const addonHeaders = function () {
  return {
    Accept: 'application/vnd.heroku+json; version=3.actions',
    'Accept-Expansion': 'addon_service,plan',
  }
}

// const attachmentHeaders = function () {
//   return {
//     Accept: 'application/vnd.heroku+json; version=3.actions',
//     'Accept-Inclusion': 'addon:plan,config_vars',
//   }
// }

export const appAddon = function (heroku: APIClient, app: string, id: string, options: Heroku.AddOnAttachment = {}) {
  const headers = addonHeaders()
  return heroku.post<Heroku.AddOnAttachment[]>('/actions/addons/resolve', {
    headers: headers,
    body: {app: app, addon: id, addon_service: options.addon_service},
  })
    .then(response => singularize('addon', options.namespace || '')(response?.body))
}

const handleNotFound = function (err: HTTPError, resource: string) {
  if (err.statusCode === 404 && err.body && err.body.resource === resource) {
    return true
  }

  throw err
}

const addonResolver = function (heroku: APIClient, app: string, id: string, options?: Heroku.AddOnAttachment) {
  const headers = addonHeaders()

  const getAddon = function (addonId: string) {
    return heroku.post<Heroku.AddOnAttachment[]>('/actions/addons/resolve', {
      headers: headers,
      body: {app: null, addon: addonId, addon_service: options?.addon_service},
    })
      .then(response => singularize('addon', options?.namespace || '')(response?.body))
  }

  if (!app || id.includes('::')) return getAddon(id)

  return appAddon(heroku, app, id, options)
    .catch(function (error: HTTPError) {
      if (handleNotFound(error, 'add_on')) return getAddon(id)
    })
}

/**
 * Replacing memoize with our own memoization function that works with promises
 * https://github.com/lodash/lodash/blob/da329eb776a15825c04ffea9fa75ae941ea524af/lodash.js#L10534
 */
function memoizePromise(func: (...args: any[]) => any, resolver: (...args: any[]) => any) {
  const memoized = function (...args: any[]) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const key = resolver.apply(this, args)
    const cache = memoized.cache

    if (cache.has(key)) {
      return cache.get(key)
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = func.apply(this, args)

    return result.then(function () {
      memoized.cache = cache.set(key, result) || cache
      return result
    })
  }

  memoized.cache = new _.memoize.Cache()
  return memoized
}

export const resolveAddon = memoizePromise(addonResolver, (_, app, id, options = {}) => `${app}|${id}|${options.addon_service}`)

function NotFound(this: any) {
  Error.call(this)
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name

  this.statusCode = 404
  this.message = 'Couldn\'t find that addon.'
}

function AmbiguousError(this: any, matches: {name: string}[], type: string) {
  Error.call(this)
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name

  this.statusCode = 422
  this.message = `Ambiguous identifier; multiple matching add-ons found: ${matches.map(match => match.name).join(', ')}.`
  this.body = {id: 'multiple_matches', message: this.message}
  this.matches = matches
  this.type = type
}

const singularize = function (type: string, namespace?: string) {
  return (matches: Heroku.AddOnAttachment[]) => {
    if (namespace) {
      matches = matches.filter(m => m.namespace === namespace)
    } else if (matches.length > 1) {
      // In cases that aren't specific enough, filter by namespace
      matches = matches.filter(m => !m.hasOwnProperty('namespace') || m.namespace === null)
    }

    switch (matches.length) {
    case 0:
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      throw new NotFound()
    case 1:
      return matches[0]
    default:
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      throw new AmbiguousError(matches, type)
    }
  }
}

// export const attachment = function (heroku: APIClient, app: string, id: string, options: Heroku.AddOnAttachment = {}) {
//   const headers = attachmentHeaders()
//
//   function getAttachment(id) {
//     return heroku.post('/actions/addon-attachments/resolve', {
//       headers: headers, body: {app: null, addon_attachment: id, addon_service: options.addon_service},
//     }).then(singularize('addon_attachment', options.namespace))
//       .catch(function (error) {
//         handleNotFound(error, 'add_on attachment')
//       })
//   }
//
//   function getAppAddonAttachment(addon, app) {
//     return heroku.get(`/addons/${encodeURIComponent(addon.id)}/addon-attachments`, {headers})
//       .then(filter(app, options.addon_service))
//       .then(singularize('addon_attachment', options.namespace))
//   }
//
//   let promise
//   if (!app || id.includes('::')) {
//     promise = getAttachment(id)
//   } else {
//     promise = appAttachment(heroku, app, id, options)
//       .catch(function (error) {
//         handleNotFound(error, 'add_on attachment')
//       })
//   }
//
//   // first check to see if there is an attachment matching this app/id combo
//   return promise
//     .then(function (attachment) {
//       return {attachment}
//     })
//     .catch(function (error) {
//       return {error}
//     })
//   // if no attachment, look up an add-on that matches the id
//     .then(attachOrError => {
//       const {attachment, error} = attachOrError
//
//       if (attachment) return attachment
//
//       // If we were passed an add-on slug, there still could be an attachment
//       // to the context app. Try to find and use it so `context_app` is set
//       // correctly in the SSO payload.
//       if (app) {
//         return exports.addon(heroku, app, id, options)
//           .then(addon => getAppAddonAttachment(addon, app))
//           .catch(addonError => {
//             if (error) throw error
//             throw addonError
//           })
//       }
//
//       if (error) throw error
//       throw new NotFound()
//     })
// }

// export const appAttachment = function (heroku, app, id, options = {}) {
//   const headers = attachmentHeaders()
//   return heroku.post('/actions/addon-attachments/resolve', {
//     headers: headers, body: {app: app, addon_attachment: id, addon_service: options.addon_service},
//   }).then(singularize('addon_attachment', options.namespace))
// }

// const filter = function (app, addonService) {
//   return attachments => {
//     return attachments.filter(attachment => {
//       if (attachment.app.name !== app) {
//         return false
//       }
//
//       if (addonService && attachment.addon_service.name !== addonService) {
//         return false
//       }
//
//       return true
//     })
//   }
// }
