/* eslint-disable no-await-in-loop */
import {ux} from '@oclif/core'
import color from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {APIClient} from '@heroku-cli/command'

export const waitForAddonProvisioning = async function (api: APIClient, addon: Heroku.AddOn, interval: number) {
  const app = addon.app?.name || ''
  const addonName = addon.name
  let addonBody = {...addon}

  ux.action.start(`Creating ${color.addon(addonName || '')}`)

  while (addonBody.state === 'provisioning') {
    // eslint-disable-next-line no-promise-executor-return
    await new Promise(resolve => setTimeout(resolve, interval * 1000))

    const addonResponse = await api.get<Heroku.AddOn>(`/apps/${app}/addons/${addonName}`, {
      headers: {'Accept-Expansion': 'addon_service,plan'},
    })

    addonBody = addonResponse?.body
  }

  if (addonBody.state === 'deprovisioned') {
    throw new Error(`The add-on was unable to be created, with status ${addonBody.state}`)
  }

  ux.action.stop()
  return addonBody
}

