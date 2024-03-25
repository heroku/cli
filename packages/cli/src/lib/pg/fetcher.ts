import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {appAttachment} from '../../lib/addons/resolve'
import debug from 'debug'
import {color} from '@heroku-cli/color'
import {getConfigVarName} from './util'

const pgDebug = debug('pg')

export type TransferSchedule = {
  hour: number,
  name: string,
  timezone: string,
}

type AddOnAttachment = {
  addon: {
    id: string;
    name: string;
    plan: {
      name: string;
    };
  };
  app: {
    id: string;
    name: string;
  };
  config_vars: string[];
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

async function allAttachments(heroku: APIClient, app: string) {
  const {body: attachments} = await heroku.get<AddOnAttachment[]>(`/apps/${app}/addon-attachments`, {
    headers: {'Accept-Inclusion': 'addon:plan,config_vars'},
  })
  return attachments.filter((a: AddOnAttachment) => a.addon?.plan.name.startsWith('heroku-postgresql'))
}

export async function getAttachment(heroku: APIClient, app: string, passedDb?: string, namespace?: string) {
  let db = passedDb || 'DATABASE_URL'

  function matchesHelper(app: string, db: string) {
    pgDebug(`fetching ${db} on ${app}`)

    const addonService = process.env.HEROKU_POSTGRESQL_ADDON_NAME || 'heroku-postgresql'
    pgDebug(`addon service: ${addonService}`)
    return appAttachment(heroku, app, db, {addon_service: addonService, namespace: namespace})
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

  let {matches} = await matchesHelper(app, db)

  // happy path where the resolver matches just one
  if (matches && matches.length === 1) {
    return matches[0]
  }

  // case for 404 where there are implicit attachments
  if (!matches) {
    // eslint-disable-next-line prefer-regex-literals
    const appConfigMatch = new RegExp('^(.+?)::(.+)').exec(db)
    if (appConfigMatch) {
      app = appConfigMatch[1]
      db = appConfigMatch[2]
    }

    if (!db.endsWith('_URL')) {
      db += '_URL'
    }

    const [{body: config}, attachments] = await Promise.all([
      heroku.get<Heroku.ConfigVars>(`/apps/${app}/config-vars`),
      // getConfig(heroku, app),
      allAttachments(heroku, app),
    ])

    if (attachments.length === 0) {
      throw new Error(`${color.app(app)} has no databases`)
    }

    matches = attachments.filter(attachment => config[db] && config[db] === config[getConfigVarName(attachment.config_vars)])

    if (matches.length === 0) {
      const validOptions = attachments.map(attachment => getConfigVarName(attachment.config_vars))
      throw new Error(`Unknown database: ${passedDb}. Valid options are: ${validOptions.join(', ')}`)
    }
  }

  // case for multiple attachments with passedDb
  const first = matches[0]

  // case for 422 where there are ambiguous attachments that are equivalent
  if (matches.every((match: AddOnAttachment) => first.addon.id === match.addon.id && first.app.id === match.app.id)) {
    const {body: config} = await heroku.get<Heroku.ConfigVars>(`/apps/${app}/config-vars`)

    if (matches.every((match: AddOnAttachment)  => config[getConfigVarName(first.config_vars)] === config[getConfigVarName(match.config_vars)])) {
      return first
    }
  }
}
