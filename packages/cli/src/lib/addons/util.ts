import {HTTPError} from '@heroku/http-call'
import {color} from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import printf from 'printf'

import ConfirmCommand from '../confirmCommand.js'

const confirmCommand = new ConfirmCommand()

export const trapConfirmationRequired = async <T> (app: string, confirm: string | undefined, fn: (confirmed?: string) => Promise<T>) => {
  try {
    return await fn(confirm)
  } catch (error) {
    if (!isHttpError(error) || error.body?.id !== 'confirmation_required') {
      throw error
    }

    await confirmCommand.confirm(app, confirm, error.body.message)
    return fn(app)
  }
}

function isHttpError(error: unknown): error is HTTPError {
  return Boolean(error) && error instanceof Error && Reflect.has(error as object, 'body')
}

// This function assumes that price.cents will reflect price per month.
// If the API returns any unit other than month
// this function will need to be updated.
export const formatPrice = function ({hourly, price}: {hourly?: boolean, price: Heroku.AddOn['price'] | number}) {
  if (!price) return
  if (price.contract) return 'contract'
  if (price.metered) return 'metered'
  if (price.cents === 0) return 'free'

  // we are using a standardized 720 hours/month
  if (hourly) return `~$${((price.cents / 100) / 720).toFixed(3)}/hour`

  const fmt = price.cents % 100 === 0 ? '$%.0f/%s' : '$%.02f/%s'
  return printf(fmt, price.cents / 100, price.unit)
}

export const formatPriceText = function (price: Heroku.AddOn['price']) {
  const priceHourly = formatPrice({hourly: true, price})
  const priceMonthly = formatPrice({hourly: false, price})
  if (!priceHourly) return ''
  if (priceHourly === 'free' || priceHourly === 'contract' || priceHourly === 'metered') return `${color.green(priceHourly)}`

  return `${color.green(priceHourly)} (max ${priceMonthly})`
}

export const grandfatheredPrice = function (addon: Heroku.AddOn) {
  const price = addon.plan?.price
  return {
    ...price,
    cents: addon.billed_price?.cents,
    contract: addon.billed_price?.contract,
  }
}

export const formatState = function (state: string) {
  switch (state) {
  case 'provisioned': {
    state = 'created'
    break
  }

  case 'provisioning': {
    state = 'creating'
    break
  }

  case 'deprovisioning': {
    state = 'destroying'
    break
  }

  case 'deprovisioned': {
    state = 'errored'
    break
  }

  default: {
    state = ''
    break
  }
  }

  return state
}
