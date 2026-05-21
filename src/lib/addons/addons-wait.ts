import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as color from '@heroku/heroku-cli-util/color'
import {createPlatformClient} from '@heroku/sdk/platform'
import {ux} from '@oclif/core/ux'

export const waitForAddonProvisioning = async function (addon: Heroku.AddOn, interval: number) {
  const app = addon.app?.name || ''
  const addonName = addon.name
  let addonBody = {...addon}

  ux.action.start(`Creating ${color.addon(addonName || '')}`)

  const platform = createPlatformClient().withHeaders({'Accept-Expansion': 'addon_service,plan'})
  while (addonBody.state === 'provisioning') {
    // eslint-disable-next-line no-promise-executor-return
    await new Promise(resolve => setTimeout(resolve, interval * 1000))

    addonBody = (await platform.addOn.infoByApp(app, addonName!)) as unknown as Heroku.AddOn
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
    }).catch(error => {
      // Not ideal, but API deletes the record returning a 404 when deprovisioned.
      if (error.statusCode === 404 || error.http?.statusCode === 404) {
        addonResponse.state = 'deprovisioned'
      } else {
        throw error
      }
    })
  }

  ux.action.stop()
  return addonResponse
}
