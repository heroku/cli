import confirmApp from '../apps/confirm-app'
import color from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import {merge} from 'lodash'
const printf = require('printf')

export const trapConfirmationRequired = async function<T> (app: string, confirm: string | undefined, fn: (confirmed?: string) => Promise<T>) {
  return await fn(confirm)
    .catch((error: any) => {
      if (!error.body || error.body.id !== 'confirmation_required')
        throw error
      return confirmApp(app, confirm, error.body.message)
        .then(() => fn(app))
    })
}

// This function assumes that price.cents will reflect price per month.
// If the API returns any unit other than month
// this function will need to be updated.
export const formatPrice = function ({price, hourly}: {price: Heroku.AddOn['price'] | number, hourly?: boolean}) {
  if (!price) return
  if (price.contract) return 'contract'
  if (price.cents === 0) return 'free'

  // we are using a standardized 720 hours/month
  if (hourly) return `~$${((price.cents / 100) / 720).toFixed(3)}/hour`

  const fmt = price.cents % 100 === 0 ? '$%.0f/%s' : '$%.02f/%s'
  return printf(fmt, price.cents / 100, price.unit)
}

export const formatPriceText = function (price: Heroku.AddOn['price']) {
  const priceHourly = formatPrice({price, hourly: true})
  const priceMonthly = formatPrice({price, hourly: false})
  if (!priceHourly) return ''
  if (priceHourly === 'free' || priceHourly === 'contract') return `${color.green(priceHourly)}`

  return `${color.green(priceHourly)} (max ${priceMonthly})`
}

export const grandfatheredPrice = function (addon: Heroku.AddOn) {
  const price = addon.plan?.price
  return Object.assign({}, price, {
    cents: addon.billed_price?.cents,
    contract: addon.billed_price?.contract,
  })
}

export const formatState = function (state: string) {
  switch (state) {
  case 'provisioned':
    state = 'created'
    break
  case 'provisioning':
    state = 'creating'
    break
  case 'deprovisioning':
    state = 'destroying'
    break
  case 'deprovisioned':
    state = 'errored'
    break
  default:
    state = ''
  }

  return state
}
