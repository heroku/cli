/*
import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ExtendedAddonAttachment} from '@heroku/heroku-cli-util'
import debug from 'debug'
import {uniqBy} from 'lodash'

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

function getAttachmentNamesByAddon(attachments: ExtendedAddonAttachment[]): Record<string, string[]> {
  return attachments.reduce((results: any, a) => {
    results[a.addon.id] = (results[a.addon.id] || []).concat(a.name)
    return results
  }, {})
}

export async function all(heroku: APIClient, app_id: string): Promise<Array<ExtendedAddonAttachment['addon'] & {attachment_names?: string[]}>> {
  pgDebug(`fetching all DBs on ${app_id}`)

  const attachments = await allAttachments(heroku, app_id)
  let addons: Array<ExtendedAddonAttachment['addon'] & {attachment_names?: string[]}> = attachments.map(a => a.addon)

  // Get the list of attachment names per addon here and add to each addon obj
  const attachmentNamesByAddon = getAttachmentNamesByAddon(attachments)
  addons = uniqBy(addons, 'id')
  addons.forEach(addon => {
    addon.attachment_names = attachmentNamesByAddon[addon.id]
  })

  return addons
}

async function allAttachments(heroku: APIClient, app_id: string): Promise<ExtendedAddonAttachment[]> {
  const {body: attachments} = await heroku.get<ExtendedAddonAttachment[]>(`/apps/${app_id}/addon-attachments`, {
    headers: {'Accept-Inclusion': 'addon:plan,config_vars'},
  })
  return attachments.filter((a: ExtendedAddonAttachment) => a.addon.plan?.name?.startsWith('heroku-postgresql'))
}

export async function getRelease(heroku: APIClient, appName: string, id: string) {
  const {body: release} = await heroku.get<Heroku.Release>(`/apps/${appName}/releases/${id}`)
  return release
}
*/
