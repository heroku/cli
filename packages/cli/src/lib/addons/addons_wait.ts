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

export const waitForAddonDeprovisioning = async function (api: APIClient, addon: Heroku.AddOn, interval: number) {
  const app = addon.app?.name || ''
  const addonName = addon.name || ''
  let addonResponse = {...addon}

  ux.action.start(`Destroying ${color.addon(addonName)}`)

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  while (addonResponse.state === 'deprovisioning') {
    // eslint-disable-next-line no-promise-executor-return
    await new Promise(resolve => setTimeout(resolve, interval * 1000))

    await api.get<Heroku.AddOn>(`/apps/${app}/addons/${addonName}`, {
      headers: {'Accept-Expansion': 'addon_service,plan'},
    }).then(response => {
      addonResponse = response?.body
    }).catch(function (error) {
      // Not ideal, but API deletes the record returning a 404 when deprovisioned.
      if (error.statusCode === 404) {
        addonResponse.state = 'deprovisioned'
      } else {
        throw error
      }
    })
  }

  ux.action.stop()
  return addonResponse
}
