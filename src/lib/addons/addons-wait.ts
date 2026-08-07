import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {ux} from '@oclif/core/ux'

type Platform = HerokuSDK['platform']

/**
 * Whether an error represents a 404 not-found. Some SDK/heroku-fetch errors
 * expose a top-level `statusCode`, others nest it under `http.statusCode`, so
 * check both. Shared with `commands/addons/open.ts` to keep the checks in sync.
 */
export const isNotFound = function (error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  const {http, statusCode} = error as {http?: {statusCode?: number}, statusCode?: number}
  return statusCode === 404 || http?.statusCode === 404
}

export const waitForAddonProvisioning = async function (platform: Platform, addon: Heroku.AddOn, interval: number) {
  const app = addon.app?.name || ''
  const addonName = addon.name
  let addonBody = {...addon}

  ux.action.start(`Creating ${color.addon(addonName || '')}`)

  const platformWithExpansion = platform.withHeaders({'Accept-Expansion': 'addon_service,plan'})
  while (addonBody.state === 'provisioning') {
    // eslint-disable-next-line no-promise-executor-return
    await new Promise(resolve => setTimeout(resolve, interval * 1000))

    addonBody = (await platformWithExpansion.addOn.infoByApp(app, addonName!)) as unknown as Heroku.AddOn
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
    }).catch((error: unknown) => {
      // Not ideal, but API deletes the record returning a 404 when deprovisioned.
      if (isNotFound(error)) {
        addonResponse.state = 'deprovisioned'
      } else {
        throw error
      }
    })
  }

  ux.action.stop()
  return addonResponse
}

export const pollAddonUntilDeprovisioned = async function (platform: Platform, addon: Heroku.AddOn, interval: number) {
  const app = addon.app?.name || ''
  const addonName = addon.name || ''
  let addonResponse = {...addon}

  ux.action.start(`Destroying ${color.addon(addonName)}`)

  const platformWithExpansion = platform.withHeaders({'Accept-Expansion': 'addon_service,plan'})
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  while (addonResponse.state === 'deprovisioning') {
    // eslint-disable-next-line no-promise-executor-return
    await new Promise(resolve => setTimeout(resolve, interval * 1000))

    // eslint-disable-next-line no-await-in-loop
    await (app
      ? platformWithExpansion.addOn.infoByApp(app, addonName)
      : platformWithExpansion.addOn.info(addonName)
    ).then(response => {
      addonResponse = response as unknown as Heroku.AddOn
    }).catch((error: unknown) => {
      // Not ideal, but API deletes the record returning a 404 when deprovisioned.
      if (isNotFound(error)) {
        addonResponse.state = 'deprovisioned'
      } else {
        throw error
      }
    })
  }

  ux.action.stop()
  return addonResponse
}
