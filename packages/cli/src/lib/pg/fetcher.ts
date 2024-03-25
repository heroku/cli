import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import debug from 'debug'

const pgDebug = debug('pg')

export type TransferSchedule = {
  hour: number,
  name: string,
  timezone: string,
}

export async function arbitraryAppDB(heroku: APIClient, app: string) {
  // Since Postgres backups are tied to the app and not the add-on, but
  // we require *an* add-on to interact with, make sure that add-on is
  // attached to the right app.

  pgDebug(`fetching arbitrary app db on ${app}`)
  const {body: addons} = await heroku.get<Heroku.AddOn[]>(`/apps/${app}/addons`)
  const addon = addons.find(a => a.app?.name === app && a.plan?.name?.startsWith('heroku-postgresql'))
  if (!addon) throw new Error(`No heroku-postgresql databases on ${app}`)
  return addon
}
