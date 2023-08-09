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

  formatPrice: function (price) {
    if (!price) return
    if (price.contract) return 'contract'
    if (price.cents === 0) return 'free'

    let priceHourly = Number(Math.round(Number.parseFloat((price.cents / 100) / 720) + 'e2') + 'e-2')
    const decimals = priceHourly % 100 === 0 ? 0 : 2
    const formattedPrice = `~$${priceHourly.toFixed(decimals)}/hour`
    return formattedPrice
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
