import {waitForAddonDeprovisioning} from './addons_wait'
import color from '@heroku-cli/color'
import {ux} from '@oclif/core'
import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'

export default async function (heroku: APIClient, addon: Heroku.AddOn, force: boolean, wait?: boolean) {
  const addonName = addon.name || ''

  async function destroyAddonRequest(force: boolean) {
    ux.action.start(`Destroying ${color.addon(addonName)} on ${color.app(addon.app?.name || '')}`)

    const {body: addonDelete} = await heroku.delete<Heroku.AddOn>(`/apps/${addon.app?.id}/addons/${addon.id}`, {
      headers: {'Accept-Expansion': 'plan'},
      body: {force},
    }).catch(error => {
      if (error.body && error.body.message) {
        throw new Error(`The add-on was unable to be destroyed: ${error.body.message}.`)
      } else {
        throw new Error(`The add-on was unable to be destroyed: ${error}.`)
      }
    })

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (addonDelete.state === 'deprovisioning') {
      ux.action.stop(color.yellow('pending'))
    }

    return addonDelete
  }

  let addonResponse = await destroyAddonRequest(force)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (addonResponse.state === 'deprovisioning') {
    if (wait) {
      ux.log(`Waiting for ${color.addon(addonName)}...`)
      addonResponse = await waitForAddonDeprovisioning(heroku, addonResponse, 5)
    } else {
      ux.log(`${color.addon(addonName)} is being destroyed in the background. The app will restart when complete...`)
      ux.log(`Use ${color.cmd('heroku addons:info ' + addonName)} to check destruction progress`)
    }
  } else if (addonResponse.state !== 'deprovisioned') {
    throw new Error(`The add-on was unable to be destroyed, with status ${addonResponse.state}.`)
  }

  return addonResponse
}
