import {color} from '@heroku-cli/color'
import {APIClient, Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'
import * as Heroku from '@heroku-cli/schema'
import {formatPrice, grandfatheredPrice, formatState} from '../../lib/addons/util.js'
import _ from 'lodash'

import printf from 'printf'

const topic = 'addons'
/*
async function addonGetter(api: APIClient, app?: string) {
  let attachmentsResponse: ReturnType<typeof api.get<Heroku.AddOnAttachment>> | null = null
  let addonsResponse: ReturnType<typeof api.get<Heroku.AddOn[]>>
  if (app) { // don't display attachments globally
    addonsResponse = api.get<Heroku.AddOn[]>(`/apps/${app}/addons`, {
      headers: {
        'Accept-Expansion': 'addon_service,plan',
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      },
    })
    const sudoHeaders = JSON.parse(process.env.HEROKU_HEADERS || '{}')
    if (sudoHeaders['X-Heroku-Sudo'] && !sudoHeaders['X-Heroku-Sudo-User']) {
      // because the root /addon-attachments endpoint won't include relevant
      // attachments when sudo-ing for another app, we will use the more
      // specific API call and sacrifice listing foreign attachments.
      attachmentsResponse = api.get<Heroku.AddOnAttachment>(`/apps/${app}/addon-attachments`)
    } else {
      // In order to display all foreign attachments, we'll get out entire
      // attachment list
      attachmentsResponse = api.get<Heroku.AddOnAttachment>('/addon-attachments')
    }
  } else {
    addonsResponse = api.get<Heroku.AddOn[]>('/addons', {
      headers: {
        'Accept-Expansion': 'addon_service,plan',
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      },
    })
  }

  // Get addons and attachments in parallel
  const [{body: addonsRaw}, potentialAttachments] = await Promise.all([addonsResponse, attachmentsResponse])
  function isRelevantToApp(addon: Heroku.AddOn) {
    return !app || addon.app?.name === app || _.some(addon.attachments, att => att.app.name === app)
  }

  const groupedAttachments = _.groupBy<Heroku.AddOnAttachment>(potentialAttachments?.body, 'addon.id')
  const addons: Heroku.AddOn[] = []
  addonsRaw.forEach((addon: Heroku.AddOn) => {
    addon.attachments = groupedAttachments[addon.id as string]  || []
    delete groupedAttachments[addon.id as string]
    if (isRelevantToApp(addon)) {
      addons.push(addon)
    }

    if (addon.plan) {
      addon.plan.price = grandfatheredPrice(addon)
    }
  })

  // Any attachments left didn't have a corresponding add-on record in API.
  // This is probably normal (because we are asking API for all attachments)
  // but it could also be due to certain types of permissions issues, so check
  // if the attachment looks relevant to the app, and then render whatever
  _.values(groupedAttachments)
    .forEach(atts => {
      const inaccessibleAddon = {
        app: atts[0].addon.app, name: atts[0].addon.name, addon_service: {}, plan: {}, attachments: atts,
      }
      if (isRelevantToApp(inaccessibleAddon)) {
        addons.push(inaccessibleAddon)
      }
    })

  return addons
}

function displayAll(addons: Heroku.AddOn[]) {
  addons = _.sortBy(addons, 'app.name', 'plan.name', 'addon.name')
  if (addons.length === 0) {
    ux.stdout('No add-ons.')
    return
  }

  hux.table(
    addons,
    {
      'Owning App': {
        get: ({app}) => color.cyan(app?.name || ''),
      },
      'Add-on': {
        get: ({name}) => color.magenta(name || ''),
      },
      Plan: {
        get({plan}) {
          if (plan === undefined)
            return color.dim('?')
          return plan.name
        },
      },
      Price: {
        get({plan}) {
          if (plan?.price === undefined)
            return color.dim('?')
          return formatPrice({price: plan?.price, hourly: true})
        },
      },
      'Max Price': {
        get({plan}) {
          if (plan?.price === undefined)
            return color.dim('?')
          return formatPrice({price: plan?.price, hourly: false})
        },
      },
      State: {
        get({state}) {
          let result: string = state || ''
          switch (state) {
          case 'provisioned': {
            result = 'created'
            break
          }

          case 'provisioning': {
            result = 'creating'
            break
          }

          case 'deprovisioned': {
            result = 'errored'
          }
          }

          return result
        },
      },
    },
    {
      overflow: 'wrap',
    },
  )
}

function formatAttachment(attachment: Heroku.AddOnAttachment, showApp = true) {
  const attName = color.green(attachment.name || '')
  const output = [color.dim('as'), attName]
  if (showApp) {
    const appInfo = `on ${color.cyan(attachment.app?.name || '')} app`
    output.push(color.dim(appInfo))
  }

  return output.join(' ')
}

export function renderAttachment(attachment: Heroku.AddOnAttachment, app: string, isFirst = false): string {
  const line = isFirst ? '\u2514\u2500' : '\u251C\u2500'
  const attName = formatAttachment(attachment, attachment.app?.name !== app)
  return printf(' %s %s', color.dim(line), attName)
}

function displayForApp(app: string, addons: Heroku.AddOn[]) {
  if (addons.length === 0) {
    ux.stdout(`No add-ons for app ${app}.`)
    return
  }

  const isForeignApp = (attOrAddon: Heroku.AddOn | Heroku.AddOnAttachment) => attOrAddon.app?.name !== app
  function presentAddon(addon: Heroku.AddOn) {
    const name = color.magenta(addon.name || '')
    let service = addon.addon_service?.name
    if (service === undefined) {
      service = color.dim('?')
    }

    const addonLine = `${service} (${name})`
    const atts = _.sortBy(addon.attachments, isForeignApp, 'app.name', 'name')
    // render each attachment under the add-on
    const attLines = atts.map((attachment, idx) => {
      const isFirst = (idx === addon.attachments.length - 1)
      return renderAttachment(attachment, app, isFirst)
    })
    return [addonLine].concat(attLines)
      .join('\n') + '\n' // Separate each add-on row by a blank line
  }

  addons = _.sortBy(addons, isForeignApp, 'plan.name', 'name')
  ux.stdout()
  hux.table(
    addons,
    {
      'Add-on': {get: presentAddon},
      Plan: {
        get: ({plan}) => plan && plan.name !== undefined
          ? plan.name.replace(/^[^:]+:/, '')
          : color.dim('?'),
      },
      Price: {
        get(addon) {
          if (addon.app?.name === app) {
            return formatPrice({price: addon.plan?.price, hourly: true})
          }

          return color.dim(printf('(billed to %s app)', color.cyan(addon.app?.name || '')))
        },
      },
      'Max Price': {
        get(addon) {
          if (addon.app?.name === app) {
            return formatPrice({price: addon.plan?.price, hourly: false})
          }

          return color.dim(printf('(billed to %s app)', color.cyan(addon.app?.name || '')))
        },
      },
      State: {
        get: ({state}) => formatState(state || ''),
      },
    },
    {
      overflow: 'wrap',
    },
  )
  ux.stdout(`The table above shows ${color.magenta('add-ons')} and the ${color.green('attachments')} to the current app (${app}) or other ${color.cyan('apps')}.\n  `)
}

function displayJSON(addons: Heroku.AddOn[]) {
  ux.stdout(JSON.stringify(addons, null, 2))
}

export default class Addons extends Command {
  static topic = topic
  static usage = 'addons [--all|--app APP]'
  static description = `Lists your add-ons and attachments.

  The default filter applied depends on whether you are in a Heroku app
  directory. If so, the --app flag is implied. If not, the default of --all
  is implied. Explicitly providing either flag overrides the default
  behavior.
  `
  static flags = {
    all: flags.boolean({char: 'A', description: 'show add-ons and attachments for all accessible apps'}),
    json: flags.boolean({description: 'return add-ons in json format'}),
    app: flags.app(),
    remote: flags.remote(),
  }

  static examples = [
    `$ heroku ${topic} --all`,
    `$ heroku ${topic} --app acme-inc-www`,
  ]

  public async run(): Promise<void> {
    const {flags} = await this.parse(Addons)
    const {app, all, json} = flags

    if (!all && app) {
      const addons = await addonGetter(this.heroku, app)
      if (json)
        displayJSON(addons)
      else
        displayForApp(app, addons)
    } else {
      const addons = await addonGetter(this.heroku)
      if (json)
        displayJSON(addons)
      else
        displayAll(addons)
    }
  }
}
*/
