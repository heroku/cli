'use strict'

const cli = require('heroku-cli-util')
const _ = require('lodash')

let styles = {
  app: 'cyan',
  attachment: 'green',
  addon: 'magenta'
}

module.exports = {
  // style given text or return a function that styles text according to provided style
  style: function style (s, t) {
    if (!t) return (text) => style(s, text)
    return cli.color[styles[s] || s](t)
  },

  table: function (data, options) {
    return cli.table(data, _.merge(options, {
      printLine: cli.log
    }))
  },

  grandfatheredPrice: function (addon) {
    const price = addon.plan.price
    return Object.assign({}, price, {cents: addon.billed_price.cents})
  },

  formatPrice: function (price) {
    const printf = require('printf')

    if (!price) return
    if (price.cents === 0) return 'free'

    let fmt = price.cents % 100 === 0 ? '$%.0f/%s' : '$%.02f/%s'
    return printf(fmt, price.cents / 100, price.unit)
  },

  trapConfirmationRequired: function * (app, confirm, fn) {
    return yield fn(confirm)
      .catch((err) => {
        if (!err.body || err.body.id !== 'confirmation_required') throw err
        return cli.confirmApp(app, confirm, err.body.message)
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
  }
}
