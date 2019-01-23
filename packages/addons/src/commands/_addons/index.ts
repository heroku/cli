// CHANGELOG:
// - state is now shown only when --extended is provided

// THOUGHTS:
// - Maybe we should deprecate support on `--all` considering how little performant it is
import color from '@heroku-cli/color'
import {Command, flags as Flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import ux, {cli} from 'cli-ux'

function getAddonName(addon: Heroku.AddOn) {
  let addonService: Heroku.AddOnService | undefined = addon.addon_service
  let name = color.addon(addon.name!)
  if (addonService && addonService.human_name) {
    let out = `${addonService.human_name} (${name})`
    if (addon.config_vars && addon.config_vars.length > 0) {
      addon.config_vars.forEach((v: string, i: number) => {
        let branch = (i < addon.config_vars!.length - 1) ? ' ├─' : ' └─'
        out += '\n'
        out += `${branch} as ${color.configVar(v)}`
      })
    }
    return out
  } else {
    return name
  }
}

function getPrice(addon: Heroku.AddOn, app: string | undefined) {
  if (addon.billing_entity) {
    if ((addon.billing_entity.type === 'app') && (addon.billing_entity.name === app)) {
      if (addon.billed_price) {
        const price = addon.billed_price
        if (price.contract) return 'contract'
        if (price.cents === 0) return 'free'
        return `$${(price.cents / 100).toFixed(2)}`
      }
    } else {
      let output = 'Billed to '
      output += addon.billing_entity.type === 'app' ? color.app(addon.billing_entity.name!) : addon.billing_entity.name
      // waiting for 'team' type
      // output += ` (${addon.billing_entity.type})`
      return output
    }
  }
}

function getAddonState(addon: Heroku.AddOn) {
  let state

  switch (addon.state) {
  case 'provisioned':
    state = 'created'
    break
  case 'provisioning':
    state = 'creating'
    break
  case 'deprovisioned':
    state = 'errored'
  }
  return state
}
export default class AddonsIndex extends Command {
  static description = 'lists your add-ons and attachments'

  static examples = [
    '$ heroku addons --all',
    '$ heroku addons --app acme-inc-www'
  ]

  static flags = {
    all: Flags.boolean({char: 'A', description: 'show add-ons and attachments for all accessible apps', required: false}),
    app: Flags.app(),
    json: Flags.boolean({description: 'returns add-ons in json format', required: false}),
    ...cli.table.flags({except: 'csv'})
  }

  async run() {
    const {flags} = this.parse(AddonsIndex)
    let url

    if (flags.app) {
      url = `/apps/${flags.app}/addons`
    } else {
      url = '/addons'
    }

    const headers = {'Accept-Expansion': 'addon_service, plan'}
    const {body: addons} = await this.heroku.get<Heroku.AddOn[]>(url, {headers})

    if (addons.length === 0) {
      if (flags.app) {
        cli.log(`No add-ons for app ${flags.app}`)
      } else {
        cli.log('No add-ons on your apps')
      }
      return
    }

    if (flags.json) {
      ux.styledJSON(addons)
    } else {
      ux.table(addons, {
        name: {
          get: getAddonName
        },
        plan: {
          get: row => {
            if (row.plan && row.plan.name) {
              return row.plan.name.replace(/^[^:]+:/, '')
            }
          }
        },
        price: {
          get: row => getPrice(row, flags.app)
        },
        state: {
          get: getAddonState,
          extended: true
        }
      }, {
        ...flags,
        sort: flags.sort || 'name'
      })
    }
  }
}
