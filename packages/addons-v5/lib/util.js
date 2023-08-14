'use strict'

const cli = require('heroku-cli-util')
const _ = require('lodash')

let styles = {
  app: 'cyan',
  attachment: 'green',
  addon: 'magenta',
}

module.exports = {
  // style given text or return a function that styles text according to provided style
  style: function style(s, t) {
    if (!t) return text => style(s, text)
    return cli.color[styles[s] || s](t)
  },

  table: function (data, options) {
    return cli.table(data, _.merge(options, {
      printLine: cli.log,
    }))
  },

  grandfatheredPrice: function (addon) {
    const price = addon.plan.price
    return Object.assign({}, price, {
      cents: addon.billed_price.cents,
      contract: addon.billed_price.contract,
    })
  },

  // This function assumes that price.cents will reflect price per month.
  // If the API returns any unit other than month
  // this function will need to be updated.
  // formatHourlyPrice: function (priceCents) {
  //   // we are using a standardized 720 hours/month
  //   // let priceHourly = Number(Math.round(Number.parseFloat((price.cents / 100) / 720) + 'e2') + 'e-2')
  //   // const decimals = priceHourly.toString().includes('.') ? 2 : 0
  //   // return `~$${priceHourly.toFixed(decimals)}/hour`
  //   const priceHourly = ((priceCents / 100) / 720).toPrecision(4)
  //   return `~$${priceHourly}/hour`
  // },

  formatPrice: function ({price, hourly}) {
    const printf = require('printf')

    if (!price) return
    if (price.contract) return 'contract'
    if (price.cents === 0) return 'free'

    if (hourly) return `~$${((price.cents / 100) / 720).toFixed(3)}/hour`

    let fmt = price.cents % 100 === 0 ? '$%.0f/%s' : '$%.02f/%s'
    return printf(fmt, price.cents / 100, price.unit)
  },

  trapConfirmationRequired: async function (app, confirm, fn) {
    return await fn(confirm)
      .catch(error => {
        if (!error.body || error.body.id !== 'confirmation_required') throw error
        return cli.confirmApp(app, confirm, error.body.message)
          .then(() => fn(app))
      })
  },

  formatState: function (state) {
    switch (state) {
    case 'provisioned':
      state = 'created'
      break
    case 'provisioning':
      state = 'creating'
      break
    case 'deprovisioned':
      state = 'errored'
      break
    default:
      state = ''
    }

    return state
  },
}
