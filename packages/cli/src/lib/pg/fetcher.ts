import {APIClient} from '@heroku-cli/command'
import type {AddOnAttachment} from '@heroku-cli/schema'
import * as Heroku from '@heroku-cli/schema'
import debug from 'debug'
import {AmbiguousError, appAttachment, NotFound} from '../addons/resolve'
import {getConfig} from './config'
import color from '@heroku-cli/color'
import type {AddOnAttachmentWithConfigVarsAndPlan} from './types'
import {getConfigVarName} from './util'

const pgDebug = debug('pg')

export async function arbitraryAppDB(heroku: APIClient, app: string) {
  // Since Postgres backups are tied to the app and not the add-on, but
  // we require *an* add-on to interact with, make sure that add-on is
  // attached to the right app.

  pgDebug(`fetching arbitrary app db on ${app}`)
  const {body: addons} = await heroku.get<Heroku.AddOn[]>(`/apps/${app}/addons`)
  const addon = addons.find(a => a?.app?.name === app && a?.plan?.name?.startsWith('heroku-postgresql'))
  if (!addon) throw new Error(`No heroku-postgresql databases on ${app}`)
  return addon
}

function getAttachmentNamesByAddon(attachments: AddOnAttachmentWithConfigVarsAndPlan[]) {
  return attachments.reduce((results: any, a) => {
    results[a.addon.id] = (results[a.addon.id] || []).concat(a.name)
    return results
  }, {})
}

export async function all(heroku: APIClient, app_id: string) {
  const {uniqBy} = require('lodash')

  pgDebug(`fetching all DBs on ${app_id}`)

  const attachments = await allAttachments(heroku, app_id)
  let addons = attachments.map(a => a.addon)

  // Get the list of attachment names per addon here and add to each addon obj
  const attachmentNamesByAddon = getAttachmentNamesByAddon(attachments)
  addons = uniqBy(addons, 'id')
  addons.forEach(addon => {
    addon.attachment_names = attachmentNamesByAddon[addon.id]
  })

  return addons
}

async function matchesHelper(heroku: APIClient, app: string, db: string, namespace?: string): Promise<{matches: AddOnAttachment[] | null, error?: AmbiguousError | NotFound}> {
  debug(`fetching ${db} on ${app}`)

  const addonService = process.env.HEROKU_POSTGRESQL_ADDON_NAME || 'heroku-postgresql'
  debug(`addon service: ${addonService}`)
  try {
    const attached = await appAttachment(heroku, app, db, {addon_service: addonService, namespace})
    return ({matches: [attached]})
  } catch (error) {
    if (error instanceof AmbiguousError && error.body?.id === 'multiple_matches' && error.matches) {
      return {matches: error.matches, error}
    }

    if (error instanceof NotFound) {
      return {matches: null, error}
    }

    throw error
  }
}

export async function getAttachment(heroku: APIClient, app: string, db = 'DATABASE_URL', namespace = ''): Promise<Required<AddOnAttachment & {addon: AddOnAttachmentWithConfigVarsAndPlan}>> {
  const matchesOrError = await matchesHelper(heroku, app, db, namespace)
  let {matches} = matchesOrError
  const {error} = matchesOrError
  // happy path where the resolver matches just one
  if (matches && matches.length === 1) {
    return matches[0] as Required<AddOnAttachment & {addon: AddOnAttachmentWithConfigVarsAndPlan}>
  }

  // case for 404 where there are implicit attachments
  if (!matches) {
    const appConfigMatch = /^(.+?)::(.+)/.exec(db)
    if (appConfigMatch) {
      app = appConfigMatch[1]
      db = appConfigMatch[2]
    }

    if (!db.endsWith('_URL')) {
      db += '_URL'
    }

    const [config = {}, attachments] = await Promise.all([
      getConfig(heroku, app),
      allAttachments(heroku, app),
    ])

    if (attachments.length === 0) {
      throw new Error(`${color.app(app)} has no databases`)
    }

    console.log('hi', JSON.stringify(attachments))
    matches = attachments.filter(attachment => config[db] && config[db] === config[getConfigVarName(attachment.config_vars as string[])])

    if (matches.length === 0) {
      const validOptions = attachments.map(attachment => getConfigVarName(attachment.config_vars as string[]))
      throw new Error(`Unknown database: ${db}. Valid options are: ${validOptions.join(', ')}`)
    }
  }

  // case for multiple attachments with passedDb
  const first = matches[0] as Required<AddOnAttachment & {addon: AddOnAttachmentWithConfigVarsAndPlan}>

  // case for 422 where there are ambiguous attachments that are equivalent
  if (matches.every(match => first.addon?.id === match.addon?.id && first.app?.id === match.app?.id)) {
    const config = await getConfig(heroku, first.app.name as string) ?? {}

    if (matches.every(match => config[getConfigVarName(first.config_vars)] === config[getConfigVarName(match.config_vars)])) {
      return first
    }
  }

  throw error
}

async function allAttachments(heroku: APIClient, app_id: string) {
  const {body: attachments} = await heroku.get<AddOnAttachmentWithConfigVarsAndPlan[]>(`/apps/${app_id}/addon-attachments`, {
    headers: {'Accept-Inclusion': 'addon:plan,config_vars'},
  })
  return attachments.filter((a: AddOnAttachmentWithConfigVarsAndPlan) => a.addon.plan?.name?.startsWith('heroku-postgresql'))
}

export async function getAddon(heroku: APIClient, app: string, db = 'DATABASE_URL') {
  return ((await getAttachment(heroku, app, db))).addon
}
