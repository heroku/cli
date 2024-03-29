import {APIClient} from '@heroku-cli/command'
import {HTTP, HTTPError} from 'http-call'
import type {AddOn, AddOnAttachment} from '@heroku-cli/schema'
import {HerokuAPIError} from '@heroku-cli/command/lib/api-client'
import type {AddOnAttachmentWithConfigVarsAndPlan} from '../pg/types'

const addonHeaders = {
  Accept: 'application/vnd.heroku+json; version=3.actions',
  'Accept-Expansion': 'addon_service,plan',
}

export const appAddon = async function (heroku: APIClient, app: string, id: string, options: AddOnAttachment = {}) {
  const response = await heroku.post<AddOnAttachmentWithConfigVarsAndPlan[]>('/actions/addons/resolve', {
    headers: addonHeaders,
    body: {app: app, addon: id, addon_service: options.addon_service},
  })

  return singularize('addon', options.namespace)(response?.body)
}

const handleNotFound = function (err: { statusCode: number, body?: { resource: string } }, resource: string) {
  if (err.statusCode === 404 && err.body && err.body.resource === resource) {
    return true
  }

  throw err
}

export const addonResolver = async (heroku: APIClient, app: string | undefined, id: string, options?: AddOnAttachment) => {
  const getAddon = async (addonId: string) => {
    const response = await heroku.post<AddOnAttachmentWithConfigVarsAndPlan[]>('/actions/addons/resolve', {
      headers: addonHeaders,
      body: {app: null, addon: addonId, addon_service: options?.addon_service},
    })
    return singularize('addon', options?.namespace || '')(response?.body)
  }

  if (!app || id.includes('::')) {
    return getAddon(id)
  }

  try {
    return await appAddon(heroku, app, id, options)
  } catch (error) {
    if (error instanceof HTTPError && handleNotFound(error, 'add_on')) {
      return getAddon(id)
    }

    throw error
  }
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

export const appAttachment = async (heroku: APIClient, app: string | undefined, id: string, options: {
  addon_service?: string,
  namespace?: string
} = {}): Promise<AddOnAttachment & { addon: AddOnAttachmentWithConfigVarsAndPlan }> => {
  const result = await heroku.post<(AddOnAttachment & {
    addon: AddOnAttachmentWithConfigVarsAndPlan
  })[]>('/actions/addon-attachments/resolve', {
      headers: attachmentHeaders, body: {app, addon_attachment: id, addon_service: options.addon_service},
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
      if (error instanceof HerokuAPIError) {
        handleNotFound(error.http, 'add_on attachment')
      }
    }
  }

  async function getAppAddonAttachment(addon: AddOnAttachment, app: string | undefined): Promise<AddOnAttachment | void> {
    try {
      const result: HTTP<AddOn[]> = await heroku.get(`/addons/${encodeURIComponent(addon.id ?? '')}/addon-attachments`, {headers: attachmentHeaders})
      const matches = filter(app, options.addon_service)(result.body)
      return singularize('addon_attachment', options.namespace)(matches)
    } catch (error) {
      const err = error instanceof HerokuAPIError ? error.http : error as NotFound
      handleNotFound(err, 'add_on attachment')
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
      const err = error instanceof HerokuAPIError ? error.http : error as NotFound
      handleNotFound(err, 'add_on attachment')
    }
  }
}
// -----------------------------------------------------
// END
// -----------------------------------------------------

const addonResolverMap = new Map<string, ReturnType<typeof addonResolver>>()

export async function resolveAddon(...args: Parameters<typeof addonResolver>): ReturnType<typeof addonResolver> {
  const [, app, id, options] = args
  const key = `${app}|${id}|${options?.addon_service ?? ''}`
  const promise: ReturnType<typeof addonResolver> = addonResolverMap.get(key) || addonResolver(...args)
  try {
    await promise
    addonResolverMap.has(key) || addonResolverMap.set(key, promise)
  } catch {
    addonResolverMap.delete(key)
  }

  return promise
}

resolveAddon.cache = addonResolverMap

export class NotFound extends Error {
  public readonly statusCode = 404
  public readonly message = 'Couldn\'t find that addon.'
}

export class AmbiguousError extends Error {
  public readonly statusCode = 422
  public readonly message: string
  public readonly body = {id: 'multiple_matches', message: this.message}

  constructor(public readonly matches: { name?: string }[], public readonly type: string) {
    super()
    this.message = `Ambiguous identifier; multiple matching add-ons found: ${matches.map(match => match.name).join(', ')}.`
  }
}

function singularize(type?: string | null, namespace?: string | null) {
  return <T extends { namespace?: string | null, name?: string }>(matches: T[]): T => {
    if (namespace) {
      matches = matches.filter(m => m.namespace === namespace)
    } else if (matches.length > 1) {
      // In cases that aren't specific enough, filter by namespace
      matches = matches.filter(m => !Reflect.has(m, 'namespace') || m.namespace === null)
    }

    switch (matches.length) {
    case 0:
      throw new NotFound()

    case 1:
      return matches[0]

    default:
      throw new AmbiguousError(matches, type ?? '')
    }
  }
}

