import color from '@heroku-cli/color'
import {APIClient, Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {formatPrice, grandfatheredPrice, formatState} from '../../lib/addons/util'
import {groupBy, some, sortBy, values} from 'lodash'
const printf = require('printf')

const topic = 'addons'

async function addonGetter(api: APIClient, app?: string) {
  let attachmentsResponse: ReturnType<typeof api.get<Heroku.AddOnAttachment>> | null = null
  let addonsResponse: ReturnType<typeof api.get<Heroku.AddOn[]>>
  if (app) {
    addonsResponse = api.get<Heroku.AddOn[]>(`/apps/${app}/addons`, {
      headers: {
        'Accept-Expansion': 'addon_service,plan',
      },
    })
    const sudoHeaders = JSON.parse(process.env.HEROKU_HEADERS || '{}')
    if (sudoHeaders['X-Heroku-Sudo'] && !sudoHeaders['X-Heroku-Sudo-User']) {
      attachmentsResponse = api.get<Heroku.AddOnAttachment>(`/apps/${app}/addon-attachments`)
    } else {
      attachmentsResponse = api.get<Heroku.AddOnAttachment>('/addon-attachments')
    }
  } else {
    addonsResponse = api.get<Heroku.AddOn[]>('/addons', {
      headers: {
        'Accept-Expansion': 'addon_service,plan',
      },
    })
  }

  const data = await Promise.all([addonsResponse, attachmentsResponse])
  function isRelevantToApp(addon: Heroku.AddOn) {
    return !app || addon.app?.name === app || some(addon.attachments, att => att.app.name === app)
  }

  const groupedAttachments = groupBy<Heroku.AddOnAttachment>(data[1]?.body, 'addon.id')
  const addons = []
  data[0].body.forEach(function (addon: Heroku.AddOn) {
    addon.attachments = groupedAttachments[addon.id as string]  || []
    delete groupedAttachments[addon.id as string]
    if (isRelevantToApp(addon)) {
      addons.push(addon)
    }

    if (addon.plan) {
      addon.plan.price = grandfatheredPrice(addon)
    }
  })
  values(groupedAttachments)
    .forEach(function (atts) {
      const inaccessibleAddon = {
        app: atts[0].addon.app, name: atts[0].addon.name, addon_service: {}, plan: {}, attachments: atts,
      }
      if (isRelevantToApp(inaccessibleAddon)) {
        addons.push(inaccessibleAddon)
      }
    })
  return addonsResponse
}

function displayAll(addons: Heroku.AddOn[]) {
  addons = sortBy(addons, 'app.name', 'plan.name', 'addon.name')
  if (addons.length === 0) {
    ux.log('No add-ons.')
    return
  }

  ux.table(
    addons,
    {
      'Owning App': {
        get: ({app}) => color.cyan(app?.name || ''),
      },
      name: {
        header: 'Add-on', get: ({name}) => color.magenta(name || ''),
      },
      Plan: {
        get: function ({plan}) {
          if (typeof plan === 'undefined')
            return color.dim('?')
          return plan.name
        },
      },
      Price: {
        get: function ({plan}) {
          if (typeof plan?.price === 'undefined')
            return color.dim('?')
          return formatPrice({price: plan?.price, hourly: true})
        },
      },
      'Max Price': {
        get: function ({plan}) {
          if (typeof plan?.price === 'undefined')
            return color.dim('?')
          return formatPrice({price: plan?.price, hourly: false})
        },
      },
      State: {
        get: function ({state}) {
          let result: string = state || ''
          switch (state) {
          case 'provisioned':
            result = 'created'
            break
          case 'provisioning':
            result = 'creating'
            break
          case 'deprovisioned':
            result = 'errored'
          }

          return result
        },
      },
    },
    {
      printLine: ux.log,
      headerAnsi: color.bold,
    })
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

function renderAttachment(attachment: Heroku.AddOnAttachment, app: string, isFirst = false) {
  const line = isFirst ? '\u2514\u2500' : '\u251C\u2500'
  const attName = formatAttachment(attachment, attachment.app?.name !== app)
  return printf(' %s %s', color.dim(line), attName)
}

function displayForApp(app: string, addons: Heroku.AddOn[]) {
  if (addons.length === 0) {
    ux.log(`No add-ons for app ${app}.`)
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
    const atts = sortBy(addon.attachments, isForeignApp, 'app.name', 'name')
    const attLines = atts.map(function (attachment, idx) {
      const isFirst = (idx === addon.attachments.length - 1)
      return renderAttachment(attachment, app, isFirst)
    })
    return [addonLine].concat(attLines)
      .join('\n')
  }

  addons = sortBy(addons, isForeignApp, 'plan.name', 'name')
  ux.log()
  ux.table(
    addons,
    {
      'Add-on': {get: presentAddon},
      Plan: {
        get: ({plan}) => plan && plan.name !== undefined ?
          plan.name.replace(/^[^:]+:/, '') :
          color.dim('?'),
      },
      Price: {
        get: function (addon) {
          if (addon.app?.name === app) {
            return formatPrice({price: addon.plan?.price, hourly: true})
          }

          return color.dim(printf('(billed to %s app)', color.cyan(addon.app?.name || '')))
        },
      },
      'Max Price': {
        get: function (addon) {
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
      after: () => ux.log(''),
      printLine: ux.log,
      headerAnsi: color.bold,
    },
  )
  ux.log(`The table above shows ${color.magenta('add-ons')} and the ${color.green('attachments')} to the current app (${app}) or other ${color.cyan('apps')}.\n  `)
}

function displayJSON(addons: Heroku.AddOn[]) {
  ux.log(JSON.stringify(addons, null, 2))
}

export default class Addons extends Command {
  static topic = topic
  static description = 'lists your add-ons and attachments'
  static flags = {
    all: flags.boolean({char: 'A', description: 'show add-ons and attachments for all accessible apps'}),
    json: flags.boolean({description: 'return add-ons in json format'}),
    app: flags.app(),
  }

  static examples = [
    `$ heroku ${topic} --all`,
    `$ heroku ${topic} --app acme-inc-www`,
  ]

  static help = `The default filter applied depends on whether you are in a Heroku app
  directory. If so, the --app flag is implied. If not, the default of --all
  is implied. Explicitly providing either flag overrides the default
  behavior.`

  public async run(): Promise<void> {
    const {flags} = await this.parse(Addons)
    const {app, all, json} = flags

    if (!all && app) {
      const {body: addons} = await addonGetter(this.heroku, app)
      if (json)
        displayJSON(addons)
      else
        displayForApp(app, addons)
    } else {
      const {body: addons} = await addonGetter(this.heroku)
      if (json)
        displayJSON(addons)
      else
        displayAll(addons)
    }
  }
}
