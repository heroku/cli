import {color, utils} from '@heroku/heroku-cli-util'
import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

import {waitForAddonDeprovisioning} from './addons_wait.js'

export default async function (heroku: APIClient, addon: Heroku.AddOn, force = false, wait = false) {
  const addonName = addon.name || ''

  async function destroyAddonRequest() {
    ux.action.start(`Destroying ${color.addon(addonName)} on ${color.app(addon.app?.name || '')}`)

    const {body: addonDelete} = await heroku.delete<Heroku.AddOn>(`/apps/${addon.app?.id}/addons/${addon.id}`, {
      body: {force},
      headers: {'Accept-Expansion': 'plan'},
    }).catch(error => {
      const errorMessage = error.body?.message || error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (utils.pg.isAdvancedDatabase(addon as any)) {
        throw new Error(`We can't destroy your database due to an error: ${errorMessage}. Try again or open a ticket with Heroku Support: https://help.heroku.com/`)
      } else {
        throw new Error(`The add-on was unable to be destroyed: ${errorMessage}.`)
      }
    })

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (addonDelete.state === 'deprovisioning') {
      ux.action.stop(color.info('pending'))
    }

    ux.action.stop()
    return addonDelete
  }

  let addonResponse = await destroyAddonRequest()
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (addonResponse.state === 'deprovisioning') {
    if (wait) {
      ux.stdout(`Waiting for ${color.addon(addonName)}...`)
      addonResponse = await waitForAddonDeprovisioning(heroku, addonResponse, 5)
    } else {
      ux.stdout(`${color.addon(addonName)} is being destroyed in the background. The app will restart when complete...`)
      ux.stdout(`Run ${color.code('heroku addons:info ' + addonName)} to check destruction progress`)
    }
  } else if (addonResponse.state !== 'deprovisioned') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (utils.pg.isAdvancedDatabase(addonResponse as any)) {
      throw new Error(`You can't destroy a database with a ${addonResponse.state} status.`)
    } else {
      throw new Error(`The add-on was unable to be destroyed, with status ${addonResponse.state}.`)
    }
  }

  return addonResponse
}
