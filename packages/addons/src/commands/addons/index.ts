// CHANGELOG:
// - state is now shown only when --extended is provided

// THOUGHTS:
// - Maybe only show attachments when using the `--extended` flag? ->
      // It wouldn't quite work considering this is per column, (maybe if it were comma separated?)

import * as Heroku from '@heroku-cli/schema'

import {Command, flags} from '@heroku-cli/command'

import ux, {cli} from 'cli-ux'

function getAddonName(addon: Heroku.AddOn) {
  let addonService: Heroku.AddOnService | undefined = addon.addon_service
  if (addonService && addonService.human_name) {
    return `${addonService.human_name} (${addon.name})`
  } else {
    return addon.name
  }
}

function getPrice(addon: Heroku.AddOn, app: string | undefined) {
  if (addon.billing_entity) {
    if (app) {
      if ((addon.billing_entity.type === 'app') && (addon.billing_entity.name === app)) {
        if ((addon.plan) && (addon.plan.price)) {
          const price = addon.plan.price
          if (price.contract) return 'contract'
          if (price.cents === 0) return 'free'
          return `$${(price.cents / 100).toFixed(2)}`
        }
      } else {
        let output = 'Billed to '
        // TODO: Check whether I could still use `cli.color.app` from `heroku-cli-util
        output += addon.billing_entity.type === 'app' ? addon.billing_entity.name : addon.billing_entity.name
        output += ` (${addon.billing_entity.type})`
        return output
      }
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
    all: flags.boolean({char: 'A', description: 'show add-ons and attachments for all accessible apps', required: false}),
    app: flags.app(),
    json: flags.boolean({description: 'returns add-ons in json format', required: false}),
    ...cli.table.flags()
  }

  async run() {
    const {flags} = this.parse(AddonsIndex)
    let url

    if ((!flags.app) && (!flags.all)) {
      cli.error('You need to specify the scope via --app or --all')
    }

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

      // if no flag showing attachments was specified
      cli.log(`\nTo show attachments to the current app ${flags.app} use --extended`)
    }
  }
}
