import {APIClient} from '@heroku-cli/command'
import {HTTP, HTTPError} from 'http-call'
import * as _ from 'lodash'
import type {AddOn, AddOnAttachment} from '@heroku-cli/schema'

const addonHeaders = function () {
  return {
    Accept: 'application/vnd.heroku+json; version=3.actions',
    'Accept-Expansion': 'addon_service,plan',
  }
}

export const appAddon = async function (heroku: APIClient, app: string, id: string, options: AddOnAttachment = {}) {
  const headers = addonHeaders()
  const response = await heroku.post<AddOnAttachment[]>('/actions/addons/resolve', {
    headers: headers,
    body: {app: app, addon: id, addon_service: options.addon_service},
  })

  return singularize('addon', options.namespace)(response?.body)
}

const handleNotFound = function (err: HTTPError, resource: string) {
  if (err.statusCode === 404 && err.body && err.body.resource === resource) {
    return true
  }

  throw err
}

const addonResolver = function (heroku: APIClient, app: string, id: string, options?: AddOnAttachment) {
  const headers = addonHeaders()

  const getAddon = function (addonId: string) {
    return heroku.post<AddOnAttachment[]>('/actions/addons/resolve', {
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

// -----------------------------------------------------
// Attachment resolver functions
// originating from `packages/addons-v5/lib/resolve.js`
// -----------------------------------------------------
const filter = function (app: string | undefined, addonService: AddOnAttachment['addon_service']) {
  return (attachments: AddOn[]) => {
    return attachments.filter(attachment => {
      if (attachment?.app?.name !== app) {
        return false
      }

      return !(addonService && attachment?.addon_service?.name !== addonService)
    })
  }
}

const attachmentHeaders: Readonly<{ Accept: string, 'Accept-Inclusion': string }> = {
  Accept: 'application/vnd.heroku+json; version=3.actions',
  'Accept-Inclusion': 'addon:plan,config_vars',
}

const appAttachment = async (heroku: APIClient, app: string | undefined, id: string, options: {
  addon_service?: string,
  namespace?: string
} = {}) => {
  const result: HTTP<AddOnAttachment[]> = await heroku.post('/actions/addon-attachments/resolve', {
    headers: attachmentHeaders, body: {app: app, addon_attachment: id, addon_service: options.addon_service},
  })
  return singularize('addon_attachment', options.namespace)(result.body)
}

export const attachmentResolver = async (heroku: APIClient, app: string | undefined, id: string, options: {
  addon_service?: string,
  namespace?: string
} = {}) => {
  async function getAttachment(id: string | undefined): Promise<AddOnAttachment | void> {
    try {
      const result: HTTP<AddOnAttachment[]> = await heroku.post('/actions/addon-attachments/resolve', {
        headers: attachmentHeaders, body: {app: null, addon_attachment: id, addon_service: options.addon_service},
      })
      return singularize('addon_attachment', options.namespace || '')(result.body)
    } catch (error) {
      if (error instanceof HTTPError) {
        handleNotFound(error, 'add_on attachment')
      }
    }
  }

  async function getAppAddonAttachment(addon: AddOnAttachment, app: string | undefined): Promise<AddOnAttachment | void> {
    try {
      const result: HTTP<AddOn[]> = await heroku.get(`/addons/${encodeURIComponent(addon.id ?? '')}/addon-attachments`, {headers: attachmentHeaders})
      const matches = filter(app, options.addon_service)(result.body)
      return singularize('addon_attachment', options.namespace)(matches)
    } catch (error) {
      if (error instanceof HTTPError) {
        handleNotFound(error, 'add_on attachment')
      }
    }
  }

  // first check to see if there is an attachment matching this app/id combo
  try {
    const attachment = await (!app || id.includes('::') ? getAttachment(id) : appAttachment(heroku, app, id, options))
    if (attachment) {
      return attachment
    }
  } catch {}

  // if no attachment, look up an add-on that matches the id
  // If we were passed an add-on slug, there still could be an attachment
  // to the context app. Try to find and use it so `context_app` is set
  // correctly in the SSO payload.

  if (app) {
    try {
      const addon = await resolveAddon(heroku, app, id, options)
      return await getAppAddonAttachment(addon, app)
    } catch (error) {
      if (error instanceof HTTPError) {
        handleNotFound(error, 'add_on attachment')
      }
    }
  }
}
// -----------------------------------------------------
// END
// -----------------------------------------------------

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

function AmbiguousError(this: any, matches: { name: string }[], type: string) {
  Error.call(this)
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name

  this.statusCode = 422
  this.message = `Ambiguous identifier; multiple matching add-ons found: ${matches.map(match => match.name).join(', ')}.`
  this.body = {id: 'multiple_matches', message: this.message}
  this.matches = matches
  this.type = type
}

const singularize = function (type?: string | null, namespace?: string | null) {
  return (matches: AddOnAttachment[]) => {
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
      throw new AmbiguousError(matches, type ?? '')
    }
  }
}

